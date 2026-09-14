import {blogBatch, blogQuery, type Row, type Stmt} from "@/lib/blog-db";
import {readingMinutes, SLUG_PATTERN} from "@/lib/blog-text";

export {BLOG_AUTHOR_NAME, BLOG_LOCALE} from "@/lib/blog-constants";

export type PostStatus = "draft" | "published";

export type PostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string;
  tags: string[];
  /** One per post; drives the tabs on the blog page. Empty = only under "All". */
  category: string;
  sourceUrl: string;
  status: PostStatus;
  readingMinutes: number;
  views: number;
  publishedAt: number;
  createdAt: number;
  updatedAt: number;
  likes: number;
  comments: number;
};

export type BlogPost = PostSummary & {content: string};

export type BlogComment = {
  id: string;
  postId: string;
  parentId: string | null;
  name: string;
  body: string;
  isAuthor: boolean;
  createdAt: number;
  /** True when the current visitor wrote it (lets them delete it). */
  mine: boolean;
};

// The blog is English-only: the locale/translation_slug columns stay in the table but are always 'en' / ''.
const SUMMARY_COLS = `p.id, p.slug, p.title, p.excerpt, p.cover_url, p.tags, p.category, p.source_url, p.status,
  p.reading_minutes, p.views, p.published_at, p.created_at, p.updated_at,
  (SELECT COUNT(*) FROM blog_likes l WHERE l.post_id = p.id) AS likes,
  (SELECT COUNT(*) FROM blog_comments c WHERE c.post_id = p.id) AS comments`;

const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => Number(v) || 0;

function toSummary(row: Row): PostSummary {
  return {
    id: str(row.id),
    slug: str(row.slug),
    title: str(row.title),
    excerpt: str(row.excerpt),
    coverUrl: str(row.cover_url),
    tags: str(row.tags).split(",").filter(Boolean),
    category: str(row.category),
    sourceUrl: str(row.source_url),
    status: row.status === "published" ? "published" : "draft",
    readingMinutes: num(row.reading_minutes) || 1,
    views: num(row.views),
    publishedAt: num(row.published_at),
    createdAt: num(row.created_at),
    updatedAt: num(row.updated_at),
    likes: num(row.likes),
    comments: num(row.comments)
  };
}

function toPost(row: Row): BlogPost {
  return {...toSummary(row), content: str(row.content)};
}

function toComment(row: Row, visitor: string | null): BlogComment {
  return {
    id: str(row.id),
    postId: str(row.post_id),
    parentId: str(row.parent_id) || null,
    name: str(row.name),
    body: str(row.body),
    isAuthor: num(row.is_author) === 1,
    createdAt: num(row.created_at),
    mine: Boolean(visitor) && str(row.visitor) === visitor
  };
}

// ---------- Public reads ----------

export async function listPublishedPosts(tag?: string): Promise<PostSummary[]> {
  const params: string[] = [];
  let tagFilter = "";
  if (tag) {
    tagFilter = `AND (',' || p.tags || ',') LIKE ?`;
    params.push(`%,${tag},%`);
  }
  const rows = await blogQuery(
    `SELECT ${SUMMARY_COLS} FROM blog_posts p
     WHERE p.status = 'published' ${tagFilter}
     ORDER BY p.published_at DESC LIMIT 200`,
    params
  );
  return rows.map(toSummary);
}

export type PostPageData = {
  post: BlogPost;
  likedByMe: boolean;
  comments: BlogComment[];
};

/** Post + engagement in one round trip. Drafts are returned too; callers decide who may see them. */
export async function getPostPageData(slug: string, visitor: string | null): Promise<PostPageData | null> {
  const postId = `(SELECT id FROM blog_posts WHERE slug = ?)`;
  const [postRows, likedRows, commentRows] = await blogBatch([
    {sql: `SELECT ${SUMMARY_COLS}, p.content FROM blog_posts p WHERE p.slug = ? LIMIT 1`, params: [slug]},
    {
      sql: `SELECT 1 AS liked FROM blog_likes WHERE post_id = ${postId} AND visitor = ? LIMIT 1`,
      params: [slug, visitor ?? ""]
    },
    {
      sql: `SELECT id, post_id, parent_id, name, body, is_author, visitor, created_at
            FROM blog_comments WHERE post_id = ${postId} ORDER BY created_at ASC LIMIT 1000`,
      params: [slug]
    }
  ]);
  const row = postRows?.[0];
  if (!row) return null;
  return {
    post: toPost(row),
    likedByMe: Boolean(visitor) && (likedRows?.length ?? 0) > 0,
    comments: (commentRows ?? []).map((r) => toComment(r, visitor))
  };
}

export async function getPublishedPostBySlug(slug: string): Promise<BlogPost | null> {
  const rows = await blogQuery(
    `SELECT ${SUMMARY_COLS}, p.content FROM blog_posts p WHERE p.slug = ? AND p.status = 'published' LIMIT 1`,
    [slug]
  );
  return rows[0] ? toPost(rows[0]) : null;
}

// ---------- Engagement ----------

export async function setLike(postId: string, visitor: string, liked: boolean): Promise<{liked: boolean; likes: number} | null> {
  const write: Stmt = liked
    ? {
        sql: `INSERT OR IGNORE INTO blog_likes (post_id, visitor, created_at)
              SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM blog_posts WHERE id = ? AND status = 'published')`,
        params: [postId, visitor, String(Date.now()), postId]
      }
    : {sql: `DELETE FROM blog_likes WHERE post_id = ? AND visitor = ?`, params: [postId, visitor]};
  const [, existsRows, countRows, mineRows] = await blogBatch([
    write,
    {sql: `SELECT 1 AS ok FROM blog_posts WHERE id = ? AND status = 'published'`, params: [postId]},
    {sql: `SELECT COUNT(*) AS n FROM blog_likes WHERE post_id = ?`, params: [postId]},
    {sql: `SELECT 1 AS liked FROM blog_likes WHERE post_id = ? AND visitor = ?`, params: [postId, visitor]}
  ]);
  if (!existsRows?.length) return null;
  return {liked: (mineRows?.length ?? 0) > 0, likes: num(countRows?.[0]?.n)};
}

export async function recordPostView(postId: string): Promise<void> {
  await blogQuery(`UPDATE blog_posts SET views = views + 1 WHERE id = ? AND status = 'published'`, [postId]);
}

export async function countRecentComments(ipHash: string, sinceMs: number): Promise<number> {
  const rows = await blogQuery(`SELECT COUNT(*) AS n FROM blog_comments WHERE ip_hash = ? AND created_at > ?`, [
    ipHash,
    String(sinceMs)
  ]);
  return num(rows[0]?.n);
}

export type NewComment = {
  postId: string;
  parentId: string | null;
  name: string;
  body: string;
  isAuthor: boolean;
  visitor: string;
  ipHash: string;
};

export type AddCommentResult = {ok: true; comment: BlogComment} | {ok: false; error: "post_not_found" | "parent_not_found"};

/** Replies are one level deep: the parent must be a top-level comment on the same post. */
export async function addComment(input: NewComment): Promise<AddCommentResult> {
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  const parentCheck = input.parentId
    ? `AND EXISTS (SELECT 1 FROM blog_comments WHERE id = ? AND post_id = ? AND parent_id = '')`
    : "";
  const insertParams = [
    id,
    input.postId,
    input.parentId ?? "",
    input.name,
    input.body,
    input.isAuthor ? "1" : "0",
    input.visitor,
    input.ipHash,
    String(createdAt),
    input.postId,
    ...(input.parentId ? [input.parentId, input.postId] : [])
  ];
  const [inserted, postRows] = await blogBatch([
    {
      sql: `INSERT INTO blog_comments (id, post_id, parent_id, name, body, is_author, visitor, ip_hash, created_at)
            SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
            WHERE EXISTS (SELECT 1 FROM blog_posts WHERE id = ? AND status = 'published') ${parentCheck}
            RETURNING id, post_id, parent_id, name, body, is_author, visitor, created_at`,
      params: insertParams
    },
    {sql: `SELECT 1 AS ok FROM blog_posts WHERE id = ? AND status = 'published'`, params: [input.postId]}
  ]);
  if (!postRows?.length) return {ok: false, error: "post_not_found"};
  const row = inserted?.[0];
  if (!row) return {ok: false, error: "parent_not_found"};
  return {ok: true, comment: toComment(row, input.visitor)};
}

/** Admin deletes any comment; visitors only their own. Replies to a deleted comment go with it. */
export async function deleteComment(id: string, by: {isAdmin: boolean; visitor: string | null}): Promise<boolean> {
  if (!by.isAdmin && !by.visitor) return false;
  const owner = by.isAdmin ? "" : `AND visitor = ?`;
  const [deleted] = await blogBatch([
    {sql: `DELETE FROM blog_comments WHERE id = ? ${owner} RETURNING id`, params: by.isAdmin ? [id] : [id, by.visitor!]},
    {
      sql: `DELETE FROM blog_comments WHERE parent_id = ? AND NOT EXISTS (SELECT 1 FROM blog_comments WHERE id = ?)`,
      params: [id, id]
    }
  ]);
  return (deleted?.length ?? 0) > 0;
}

// ---------- Admin ----------

export type PostInput = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  tags: string[];
  category: string;
  /** Original LinkedIn post, shown as "View on LinkedIn". */
  sourceUrl: string;
  status: PostStatus;
  /** Only used on create, to keep an imported post's original date. */
  publishedAt: number;
};

export function normalizePostInput(raw: unknown): {ok: true; value: PostInput} | {ok: false; error: string} {
  if (!raw || typeof raw !== "object") return {ok: false, error: "invalid_body"};
  const r = raw as Record<string, unknown>;
  const slug = str(r.slug).trim().toLowerCase();
  const title = str(r.title).trim();
  const coverUrl = str(r.coverUrl).trim();
  const sourceUrl = str(r.sourceUrl).trim();
  const publishedAt = Math.floor(num(r.publishedAt));
  const category = str(r.category).trim().replace(/\s+/g, " ").slice(0, 40);
  const rawTags: unknown[] = Array.isArray(r.tags) ? r.tags : str(r.tags).split(",");
  const tags = [
    ...new Set(
      rawTags
        .map((t) => str(t).trim().toLowerCase().replace(/[\s,]+/g, "-").slice(0, 30))
        .filter(Boolean)
    )
  ].slice(0, 10);

  if (!SLUG_PATTERN.test(slug) || slug.length > 80) return {ok: false, error: "invalid_slug"};
  if (!title || title.length > 200) return {ok: false, error: "invalid_title"};
  if (coverUrl && !/^(https?:\/\/|\/)/.test(coverUrl)) return {ok: false, error: "invalid_cover_url"};
  if (sourceUrl && !/^https:\/\/([a-z0-9-]+\.)?linkedin\.com\//i.test(sourceUrl)) return {ok: false, error: "invalid_source_url"};

  return {
    ok: true,
    value: {
      slug,
      title,
      excerpt: str(r.excerpt).trim().slice(0, 500),
      content: str(r.content).slice(0, 200_000),
      coverUrl,
      tags,
      category,
      sourceUrl: sourceUrl.slice(0, 500),
      status: r.status === "published" ? "published" : "draft",
      publishedAt: publishedAt > 0 && publishedAt < Date.now() + 86_400_000 ? publishedAt : 0
    }
  };
}

export async function listAllPosts(): Promise<PostSummary[]> {
  const rows = await blogQuery(
    `SELECT ${SUMMARY_COLS} FROM blog_posts p ORDER BY CASE WHEN p.status = 'draft' THEN 0 ELSE 1 END, p.published_at DESC, p.updated_at DESC`
  );
  return rows.map(toSummary);
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const rows = await blogQuery(`SELECT ${SUMMARY_COLS}, p.content FROM blog_posts p WHERE p.id = ? LIMIT 1`, [id]);
  return rows[0] ? toPost(rows[0]) : null;
}

export async function createPost(input: PostInput): Promise<BlogPost> {
  const id = crypto.randomUUID();
  const now = String(Date.now());
  await blogQuery(
    `INSERT INTO blog_posts (id, slug, locale, title, excerpt, content, cover_url, tags, category, translation_slug,
       source_url, status, reading_minutes, published_at, created_at, updated_at)
     VALUES (?, ?, 'en', ?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.slug,
      input.title,
      input.excerpt,
      input.content,
      input.coverUrl,
      input.tags.join(","),
      input.category,
      input.sourceUrl,
      input.status,
      String(readingMinutes(input.content)),
      input.publishedAt ? String(input.publishedAt) : input.status === "published" ? now : "0",
      now,
      now
    ]
  );
  return (await getPostById(id))!;
}

/** First publish stamps published_at; later edits and unpublishing keep the original date. */
export async function updatePost(id: string, input: PostInput): Promise<BlogPost | null> {
  const now = String(Date.now());
  await blogQuery(
    `UPDATE blog_posts SET slug = ?, locale = 'en', title = ?, excerpt = ?, content = ?, cover_url = ?, tags = ?,
       category = ?, translation_slug = '', source_url = ?, status = ?, reading_minutes = ?, updated_at = ?,
       published_at = CASE WHEN ? = 'published' AND published_at = 0 THEN ? ELSE published_at END
     WHERE id = ?`,
    [
      input.slug,
      input.title,
      input.excerpt,
      input.content,
      input.coverUrl,
      input.tags.join(","),
      input.category,
      input.sourceUrl,
      input.status,
      String(readingMinutes(input.content)),
      now,
      input.status,
      now,
      id
    ]
  );
  return getPostById(id);
}

/** Matches both /feed/update/urn:li:activity:ID and /posts/…-activity-ID-… source links. */
export async function findPostIdByLinkedInActivity(activityId: string): Promise<string | null> {
  const rows = await blogQuery(`SELECT id FROM blog_posts WHERE source_url LIKE ? OR source_url LIKE ? LIMIT 1`, [
    `%activity:${activityId}%`,
    `%activity-${activityId}%`
  ]);
  return rows[0] ? str(rows[0].id) : null;
}

/** `slug`, or `slug-2`, `slug-3`… — the first one no post uses yet. */
export async function uniqueSlug(slug: string): Promise<string> {
  const rows = await blogQuery(`SELECT slug FROM blog_posts WHERE slug = ? OR slug LIKE ?`, [slug, `${slug}-%`]);
  const taken = new Set(rows.map((r) => str(r.slug)));
  if (!taken.has(slug)) return slug;
  let n = 2;
  while (taken.has(`${slug}-${n}`)) n++;
  return `${slug}-${n}`;
}

export async function deletePost(id: string): Promise<void> {
  await blogBatch([
    {sql: `DELETE FROM blog_comments WHERE post_id = ?`, params: [id]},
    {sql: `DELETE FROM blog_likes WHERE post_id = ?`, params: [id]},
    {sql: `DELETE FROM blog_posts WHERE id = ?`, params: [id]}
  ]);
}

export type AdminComment = BlogComment & {postTitle: string; postSlug: string};

export async function listRecentComments(limit = 50): Promise<AdminComment[]> {
  const rows = await blogQuery(
    `SELECT c.id, c.post_id, c.parent_id, c.name, c.body, c.is_author, c.created_at,
            p.title AS post_title, p.slug AS post_slug
     FROM blog_comments c JOIN blog_posts p ON p.id = c.post_id
     ORDER BY c.created_at DESC LIMIT ${Math.max(1, Math.min(200, Math.floor(limit)))}`
  );
  return rows.map((row) => ({
    ...toComment(row, null),
    postTitle: str(row.post_title),
    postSlug: str(row.post_slug)
  }));
}
