import GithubSlugger from "github-slugger";

const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya"
};

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** URL slug from a title; Russian titles are transliterated so links stay readable. */
export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .split("")
    .map((ch) => CYRILLIC[ch] ?? ch)
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug.length <= 80) return slug;
  // Cut long slugs at a word boundary rather than mid-word.
  const cut = slug.slice(0, 81);
  return cut.slice(0, Math.max(cut.lastIndexOf("-"), 40)).replace(/-+$/g, "");
}

export function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export type Heading = {depth: 2 | 3; text: string; id: string};

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .trim();
}

/** `##` / `###` headings with the same ids rehype-slug gives them, for the table of contents. */
export function extractHeadings(markdown: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  let inFence = false;
  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const text = stripInlineMarkdown(match[2]!);
    // Every heading advances the slugger so duplicate ids match rehype-slug's numbering.
    const id = slugger.slug(text);
    const depth = match[1]!.length;
    if (depth === 2 || depth === 3) headings.push({depth, text, id});
  }
  return headings;
}
