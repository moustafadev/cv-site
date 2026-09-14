import {slugify} from "@/lib/blog-text";

/**
 * Imports a public LinkedIn post from its URL. LinkedIn serves logged-out visitors a public page
 * with JSON-LD (full text, date, author) and the post's images, so no API access is needed.
 * Only public posts work; private/connections-only posts hit the login wall.
 */

export type LinkedInPost = {
  sourceUrl: string;
  /** The post's activity id — the same for every link form (activity, share, ugcPost, lnkd.in). */
  activityId: string;
  author: string;
  text: string;
  images: string[];
  publishedAt: number;
};

export type LinkedInErrorCode = "invalid_url" | "blocked" | "not_found" | "parse_failed";

export class LinkedInImportError extends Error {
  constructor(public code: LinkedInErrorCode) {
    super(code);
  }
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

type ParsedUrl = {urnType: "activity" | "share" | "ugcPost"; id: string; postsPath: string | null};

/** Accepts /posts/…-activity-123…, /feed/update/urn:li:activity:123 and the embed form (lnkd.in is resolved first). */
export function parseLinkedInUrl(input: string): ParsedUrl | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !/(^|\.)linkedin\.com$/i.test(url.hostname)) return null;
  const path = decodeURIComponent(url.pathname);
  const urn = /urn:li:(activity|share|ugcPost):(\d{10,25})/.exec(path);
  if (urn) return {urnType: urn[1] as ParsedUrl["urnType"], id: urn[2]!, postsPath: null};
  const posts = /^\/posts\/([^/]+)/.exec(path);
  const id = posts ? /(activity|share|ugcPost)-(\d{10,25})/.exec(posts[1]!) : null;
  if (!posts || !id) return null;
  return {urnType: id[1] as ParsedUrl["urnType"], id: id[2]!, postsPath: posts[1]!};
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

async function fetchPage(url: string, timeoutMs = 12_000): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9", Accept: "text/html"},
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch {
    throw new LinkedInImportError("blocked");
  }
  if (res.status === 404 || res.status === 410) throw new LinkedInImportError("not_found");
  if (!res.ok || /authwall|\/login|checkpoint/.test(res.url)) throw new LinkedInImportError("blocked");
  return res.text();
}

type JsonLdPost = {articleBody?: string; datePublished?: string; author?: {name?: string}; image?: {url?: string} | {url?: string}[]};

function findJsonLdPost(html: string): JsonLdPost | null {
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]!) as JsonLdPost & {"@type"?: string};
      if (data["@type"] === "SocialMediaPosting" && typeof data.articleBody === "string") return data;
    } catch {
      // Ignore unrelated or malformed blocks.
    }
  }
  return null;
}

/** Images of the post itself: inside the main activity card, before its comments and "more posts". */
function postImages(html: string): string[] {
  const start = html.search(/<article[^>]*main-feed-activity-card/);
  const end = start >= 0 ? html.indexOf("</article>", start) : -1;
  const scope = start >= 0 ? html.slice(start, end > start ? end : undefined) : html;
  const seen = new Set<string>();
  const images: string[] = [];
  for (const m of scope.matchAll(/https:\/\/media\.licdn\.com\/dms\/image\/[^"'\s]*feedshare[^"'\s]*/g)) {
    const url = decodeEntities(m[0]);
    const key = url.split("?")[0]!.replace(/feedshare-shrink_[0-9_]+/g, "");
    if (seen.has(key)) continue;
    seen.add(key);
    images.push(url);
  }
  return images;
}

function embedText(html: string): string {
  const m = /<p[^>]*attributed-text-segment-list__content[^>]*>([\s\S]*?)<\/p>/.exec(html);
  if (!m) return "";
  return decodeEntities(m[1]!.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")).trim();
}

const SHORT_LINK = /https:\/\/lnkd\.in\/[A-Za-z0-9_-]+/g;

/** LinkedIn rewrites every link in a post to lnkd.in; its interstitial page holds the real URL. */
async function expandShortLinks(text: string): Promise<string> {
  const links = [...new Set(text.match(SHORT_LINK) ?? [])].slice(0, 10);
  const resolved = await Promise.all(
    links.map(async (link) => {
      try {
        const html = await fetchPage(link, 5_000);
        for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
          const target = decodeEntities(m[1]!);
          if (!/^https?:\/\/([a-z0-9-]+\.)*(linkedin\.com|licdn\.com|lnkd\.in)(\/|$)/i.test(target)) return [link, target] as const;
        }
      } catch {
        // Keep the short link if it can't be resolved.
      }
      return [link, link] as const;
    })
  );
  const map = new Map(resolved);
  return text.replace(SHORT_LINK, (link) => map.get(link) ?? link);
}

/** Share links from the LinkedIn app (lnkd.in/p/…) redirect to the post; plain lnkd.in links show an interstitial. */
async function resolveShortPostLink(input: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return input;
  }
  if (url.hostname !== "lnkd.in") return input;
  let res: Response;
  try {
    res = await fetch(`https://lnkd.in${url.pathname}`, {
      headers: {"User-Agent": UA},
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(8_000)
    });
  } catch {
    throw new LinkedInImportError("blocked");
  }
  const location = res.headers.get("location");
  if (location) return new URL(location, "https://lnkd.in").toString();
  if (res.status === 404) throw new LinkedInImportError("not_found");
  const html = await res.text();
  const target = /href="(https:\/\/[a-z.]*linkedin\.com\/(?:posts|feed\/update)\/[^"]+)"/.exec(html);
  if (!target) throw new LinkedInImportError("invalid_url");
  return decodeEntities(target[1]!);
}

/** Every link form of a post resolves to the same page; its main card names the canonical activity. */
function canonicalActivityId(html: string): string | null {
  return /data-activity-urn="urn:li:activity:(\d{10,25})"/.exec(html)?.[1] ?? null;
}

export function linkedInActivityUrl(activityId: string): string {
  return `https://www.linkedin.com/feed/update/urn:li:activity:${activityId}/`;
}

/** LinkedIn ids are snowflakes: the top bits are the creation time in ms. */
function dateFromId(id: string): number {
  try {
    const ms = Number(BigInt(id) >> BigInt(22));
    return ms > Date.UTC(2003, 0, 1) && ms < Date.now() + 86_400_000 ? ms : 0;
  } catch {
    return 0;
  }
}

export async function fetchLinkedInPost(input: string): Promise<LinkedInPost> {
  const parsed = parseLinkedInUrl(await resolveShortPostLink(input));
  if (!parsed) throw new LinkedInImportError("invalid_url");
  const urn = `urn:li:${parsed.urnType}:${parsed.id}`;
  // URLs are rebuilt from the parsed id so user input never picks the host or path we fetch.
  const candidates = [
    parsed.postsPath ? `https://www.linkedin.com/posts/${encodeURIComponent(parsed.postsPath)}` : null,
    `https://www.linkedin.com/feed/update/${urn}/`
  ].filter((u): u is string => Boolean(u));

  let lastError: LinkedInImportError = new LinkedInImportError("parse_failed");
  for (const url of candidates) {
    try {
      const html = await fetchPage(url);
      const ld = findJsonLdPost(html);
      if (!ld) continue;
      const ldImages = (Array.isArray(ld.image) ? ld.image : ld.image ? [ld.image] : [])
        .map((i) => i.url)
        .filter((u): u is string => typeof u === "string");
      const images = postImages(html);
      const activityId = canonicalActivityId(html) ?? parsed.id;
      return {
        sourceUrl: linkedInActivityUrl(activityId),
        activityId,
        author: ld.author?.name?.trim() ?? "",
        text: await expandShortLinks(ld.articleBody!.trim()),
        images: images.length ? images : ldImages,
        publishedAt: Date.parse(ld.datePublished ?? "") || dateFromId(parsed.id)
      };
    } catch (error) {
      if (error instanceof LinkedInImportError) lastError = error;
    }
  }

  // Last resort: the embed widget (no JSON-LD, but has the text and images).
  try {
    const html = await fetchPage(`https://www.linkedin.com/embed/feed/update/${urn}`);
    const text = embedText(html);
    if (text) {
      const activityId = canonicalActivityId(html) ?? parsed.id;
      return {
        sourceUrl: linkedInActivityUrl(activityId),
        activityId,
        author: "",
        text: await expandShortLinks(text),
        images: postImages(html),
        publishedAt: dateFromId(parsed.id)
      };
    }
  } catch (error) {
    if (error instanceof LinkedInImportError) lastError = error;
  }
  throw lastError;
}

// ---------- LinkedIn text → blog draft ----------

const HASHTAG = /(^|\s)#([\p{L}\p{N}_]{2,30})/gu;
const HASHTAG_LINE = /^(\s*#[\p{L}\p{N}_]+[\s,]*)+$/u;

const TITLE_MAX = 60;
const EXCERPT_MAX = 200;

/** Start of `text` cut at a word boundary, ending in "..." whenever part of the post is left out. */
function preview(text: string, max: number, hasMore: boolean): string {
  let out = text;
  if (text.length > max) {
    const cut = text.slice(0, max);
    out = cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6));
    hasMore = true;
  }
  if (!hasMore) return out;
  // "Flutter،..." / "state:..." read badly; keep ? and ! which carry meaning.
  return `${out.replace(/[\s.,:;،؛…-]+$/u, "")}...`;
}

/** Keeps LinkedIn's line layout: blank lines are paragraphs, single newlines become hard breaks. */
function toMarkdown(lines: string[]): string {
  const out: string[] = [];
  for (const raw of lines) {
    const line = raw.replace(/^\s*[•▪◦●]\s*/, "- ").trimEnd();
    if (!line) {
      if (out.length && out[out.length - 1] !== "") out.push("");
      continue;
    }
    const prev = out[out.length - 1];
    if (prev && prev !== "") out[out.length - 1] = `${prev}  `;
    out.push(line);
  }
  return out.join("\n").trim();
}

export type ImportedDraft = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  tags: string[];
  sourceUrl: string;
  publishedAt: number;
};

export function linkedInPostToDraft(post: LinkedInPost): ImportedDraft {
  const lines = post.text.replace(/\r\n/g, "\n").split("\n");
  // Trailing hashtag-only lines become tags instead of body text.
  while (lines.length && (!lines[lines.length - 1]!.trim() || HASHTAG_LINE.test(lines[lines.length - 1]!))) lines.pop();

  const tags = [...new Set([...post.text.matchAll(HASHTAG)].map((m) => m[2]!.toLowerCase()))].slice(0, 10);
  const plain = lines
    .map((l) => l.replace(/^\s*[•▪◦●-]\s*/, ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const firstLine = (lines.find((l) => l.trim()) ?? "").replace(HASHTAG, "$1$2").trim();
  // Title and excerpt are teasers of the opening line; the body keeps the whole post, first line included.
  const title = preview(firstLine || "LinkedIn post", TITLE_MAX, plain.length > firstLine.length);
  const excerpt = preview(plain, EXCERPT_MAX, false);

  const [cover, ...rest] = post.images;
  // Images on consecutive lines form one paragraph, which the post page lays out as a row.
  const gallery = rest.map((src) => `![](${src})`).join("\n");
  const body = [toMarkdown(lines), gallery].filter(Boolean).join("\n\n");

  return {
    title,
    slug: slugify(title) || `linkedin-${post.activityId}`,
    excerpt,
    content: body,
    coverUrl: cover ?? "",
    tags,
    sourceUrl: post.sourceUrl,
    publishedAt: post.publishedAt
  };
}
