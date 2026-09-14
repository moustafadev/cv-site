"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {Markdown} from "@/components/blog/Markdown";
import type {AdminComment, BlogPost, PostStatus, PostSummary} from "@/lib/blog";
import {slugify} from "@/lib/blog-text";

type Draft = {
  id: string | null;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  tags: string;
  category: string;
  sourceUrl: string;
  status: PostStatus;
  publishedAt: number;
};

type ImportedDraft = Omit<Draft, "id" | "tags" | "status" | "category"> & {tags: string[]};

const EMPTY_DRAFT: Draft = {
  id: null,
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  coverUrl: "",
  tags: "",
  category: "",
  sourceUrl: "",
  status: "draft",
  publishedAt: 0
};

const ERRORS: Record<string, string> = {
  slug_taken: "Another post already uses this slug.",
  invalid_slug: "Slug may only contain lowercase letters, numbers and dashes.",
  invalid_title: "Title is required (max 200 characters).",
  invalid_cover_url: "Cover URL must start with https:// or /.",
  invalid_source_url: "LinkedIn URL must be a https://…linkedin.com/ link.",
  linkedin_invalid_url: "That doesn't look like a LinkedIn post link. Use “Copy link to post” on LinkedIn.",
  linkedin_not_found: "LinkedIn says this post doesn't exist (deleted, or the link is wrong).",
  linkedin_blocked:
    "LinkedIn didn't return the post. Make sure it's public (visible to “Anyone”), or try again in a minute — LinkedIn sometimes blocks server requests.",
  linkedin_parse_failed: "Opened the post but couldn't read it — it may be private, a document/poll, or a repost without text.",
  blog_not_configured: "Blog storage is not configured (D1).",
  unauthorized: "Session expired — log in again at /admin."
};

function toDraft(post: BlogPost): Draft {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    coverUrl: post.coverUrl,
    tags: post.tags.join(", "),
    category: post.category,
    sourceUrl: post.sourceUrl,
    status: post.status,
    publishedAt: post.publishedAt
  };
}

const fmt = (t: number) => (t ? new Date(t).toLocaleString() : "—");

const TOOLBAR: {label: string; title: string; before: string; after: string; placeholder: string}[] = [
  {label: "H2", title: "Heading", before: "\n## ", after: "\n", placeholder: "Heading"},
  {label: "H3", title: "Subheading", before: "\n### ", after: "\n", placeholder: "Subheading"},
  {label: "B", title: "Bold", before: "**", after: "**", placeholder: "bold text"},
  {label: "I", title: "Italic", before: "_", after: "_", placeholder: "italic text"},
  {label: "`code`", title: "Inline code", before: "`", after: "`", placeholder: "code"},
  {label: "Dart", title: "Dart code block", before: "\n```dart\n", after: "\n```\n", placeholder: "void main() {}"},
  {label: "Link", title: "Link", before: "[", after: "](https://)", placeholder: "link text"},
  {label: "Image", title: "Image", before: "![", after: "](https://)", placeholder: "alt text"},
  {label: "List", title: "Bullet list", before: "\n- ", after: "\n", placeholder: "item"},
  {label: "Quote", title: "Quote", before: "\n> ", after: "\n", placeholder: "quote"}
];

export default function AdminBlogPage() {
  const [state, setState] = useState<"loading" | "unauthorized" | "ready">("loading");
  const [configured, setConfigured] = useState(true);
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/blog", {credentials: "include"});
      if (res.status === 401) {
        setState("unauthorized");
        return;
      }
      const json = (await res.json()) as {ok: boolean; configured?: boolean; posts?: PostSummary[]; comments?: AdminComment[]; error?: string};
      if (!json.ok) {
        setError(ERRORS[json.error ?? ""] ?? json.error ?? "Failed to load");
        return;
      }
      setConfigured(json.configured !== false);
      setPosts(json.posts ?? []);
      setComments(json.comments ?? []);
      setState("ready");
    } catch {
      setError("Network error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => {
      if (!d) return d;
      const next = {...d, [key]: value};
      if (key === "title" && !slugTouched && !d.id) next.slug = slugify(String(value));
      return next;
    });
    setDirty(true);
  }

  function confirmDiscard(): boolean {
    return !dirty || window.confirm("Discard unsaved changes?");
  }

  function openNew() {
    if (!confirmDiscard()) return;
    setDraft({...EMPTY_DRAFT});
    setSlugTouched(false);
    setDirty(false);
    setTab("write");
    setNotice(null);
    setError(null);
  }

  async function importFromLinkedIn(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !confirmDiscard()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/blog/import", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify({url: importUrl})
      });
      const json = (await res.json()) as {ok: boolean; error?: string; existingId?: string; draft?: ImportedDraft; author?: string; imageCount?: number};
      if (!json.ok) {
        setError(ERRORS[json.error ?? ""] ?? json.error ?? "Import failed");
        return;
      }
      setImportOpen(false);
      setImportUrl("");
      if (json.existingId) {
        setDirty(false);
        await openEdit(json.existingId);
        setNotice("This LinkedIn post was already imported — opened the existing blog post.");
        return;
      }
      const d = json.draft!;
      setDraft({...EMPTY_DRAFT, ...d, tags: d.tags.join(", ")});
      setSlugTouched(true);
      setDirty(true);
      setTab("preview");
      const images = json.imageCount ? ` with ${json.imageCount} image${json.imageCount === 1 ? "" : "s"}` : "";
      setNotice(`Imported${json.author ? ` ${json.author}'s post` : ""}${images}. Review the title and text, then Publish.`);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function openEdit(id: string) {
    if (!confirmDiscard()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/blog/${id}`, {credentials: "include"});
      const json = (await res.json()) as {ok: boolean; post?: BlogPost; error?: string};
      if (!json.ok || !json.post) {
        setError(ERRORS[json.error ?? ""] ?? "Failed to open post");
        return;
      }
      setDraft(toDraft(json.post));
      setSlugTouched(true);
      setDirty(false);
      setTab("write");
      window.scrollTo({top: 0, behavior: "smooth"});
    } finally {
      setBusy(false);
    }
  }

  function closeEditor() {
    if (!confirmDiscard()) return;
    setDraft(null);
    setDirty(false);
  }

  async function save(status?: PostStatus) {
    if (!draft || busy) return;
    const payload = {...draft, status: status ?? draft.status};
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(draft.id ? `/api/admin/blog/${draft.id}` : "/api/admin/blog", {
        method: draft.id ? "PUT" : "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify(payload)
      });
      const json = (await res.json()) as {ok: boolean; post?: BlogPost; error?: string};
      if (!json.ok || !json.post) {
        setError(ERRORS[json.error ?? ""] ?? json.error ?? "Save failed");
        return;
      }
      setDraft(toDraft(json.post));
      setSlugTouched(true);
      setDirty(false);
      setNotice(json.post.status === "published" ? "Saved — the post is live." : "Draft saved.");
      void load();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function removePost() {
    if (!draft?.id || !window.confirm(`Delete "${draft.title}" with all its likes and comments? This can't be undone.`)) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/blog/${draft.id}`, {method: "DELETE", credentials: "include"});
      setDraft(null);
      setDirty(false);
      setNotice("Post deleted.");
      void load();
    } finally {
      setBusy(false);
    }
  }

  async function removeComment(id: string) {
    if (!window.confirm("Delete this comment (and its replies)?")) return;
    const res = await fetch(`/api/blog/comments/${id}`, {method: "DELETE", credentials: "include"});
    if (res.ok || res.status === 404) setComments((cs) => cs.filter((c) => c.id !== id && c.parentId !== id));
  }

  function insert(before: string, after: string, placeholder: string) {
    const el = textareaRef.current;
    if (!el || !draft) return;
    const {selectionStart: s, selectionEnd: e, value} = el;
    const selected = value.slice(s, e) || placeholder;
    update("content", value.slice(0, s) + before + selected + after + value.slice(e));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + selected.length);
    });
  }

  function onEditorKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      void save();
    }
  }

  const input = "w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none";
  const btn = "rounded-md border border-slate-600 px-3 py-1.5 text-sm transition hover:border-sky-400 disabled:opacity-50";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="container-page max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <a href="/admin" className="text-sm text-slate-400 hover:text-sky-300">
              ← Analytics
            </a>
            <h1 className="mt-1 text-2xl font-semibold text-brand-100">Blog</h1>
          </div>
          {state === "ready" && configured && !draft ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setImportOpen((v) => !v)} className={`${btn} border-sky-700 text-sky-200`}>
                Import from LinkedIn
              </button>
              <button type="button" onClick={openNew} className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                + New post
              </button>
            </div>
          ) : null}
        </div>

        {importOpen && !draft ? (
          <form onSubmit={importFromLinkedIn} className="glass-card mt-6 space-y-3 p-5">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-300">LinkedIn post link</span>
              <input
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                className={input}
                placeholder="https://www.linkedin.com/feed/update/urn:li:activity:…  ·  https://lnkd.in/p/…  ·  https://www.linkedin.com/posts/…"
                autoFocus
                required
              />
              <span className="text-xs text-slate-500">
                On LinkedIn: ⋯ on the post → “Copy link to post”. The post must be public. Text, images, hashtags (as tags) and the
                original date are imported as an unsaved draft.
              </span>
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
                {busy ? "Importing…" : "Import"}
              </button>
              <button type="button" onClick={() => setImportOpen(false)} className={btn}>
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        {state === "loading" ? <p className="mt-8 text-sm text-slate-400">Loading…</p> : null}
        {state === "unauthorized" ? (
          <p className="mt-8 text-sm text-slate-300">
            You&apos;re not logged in.{" "}
            <a href="/admin" className="text-sky-300 underline">
              Log in at /admin
            </a>{" "}
            and come back.
          </p>
        ) : null}
        {state === "ready" && !configured ? (
          <p className="mt-8 rounded-xl border border-amber-800/80 bg-amber-950/40 p-4 text-sm text-amber-100">
            Blog storage isn&apos;t configured. Set the Cloudflare D1 variables (same as CV analytics) and redeploy. In{" "}
            <code>npm run dev</code> a local SQLite file is used automatically.
          </p>
        ) : null}

        {error ? <p className="mt-4 rounded-md border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{error}</p> : null}
        {notice ? <p className="mt-4 rounded-md border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">{notice}</p> : null}

        {draft ? (
          <section className="glass-card mt-6 space-y-4 p-5" onKeyDown={onEditorKeyDown}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-sky-200">
                {draft.id ? "Edit post" : "New post"}
                {dirty ? <span className="ml-2 text-xs font-normal text-amber-300">• unsaved</span> : null}
              </h2>
              <div className="flex flex-wrap gap-2">
                {draft.id ? (
                  <a href={`/en/blog/${draft.slug}`} target="_blank" rel="noreferrer" className={btn}>
                    {draft.status === "published" ? "View ↗" : "Preview page ↗"}
                  </a>
                ) : null}
                <button type="button" onClick={closeEditor} className={btn}>
                  Close
                </button>
              </div>
            </div>

            <label className="grid gap-1 text-sm">
              <span className="text-slate-400">Title</span>
              <input value={draft.title} onChange={(e) => update("title", e.target.value)} className={`${input} text-base`} maxLength={200} />
            </label>

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <label className="grid gap-1 text-sm">
                <span className="text-slate-400">Slug (URL)</span>
                <input
                  value={draft.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    update("slug", e.target.value.toLowerCase());
                  }}
                  className={`${input} font-mono`}
                  placeholder="my-post"
                />
                <span className="text-xs text-slate-500">
                  /en/blog/{draft.slug || "…"}
                  {draft.id && draft.status === "published" ? " — changing it breaks links already shared." : ""}
                </span>
              </label>
              <div className="grid content-start gap-1 text-sm">
                <span className="text-slate-400">Status</span>
                <span
                  className={`rounded-md px-3 py-2 text-center text-sm font-medium ${
                    draft.status === "published" ? "bg-emerald-900/50 text-emerald-200" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {draft.status === "published" ? "Published" : "Draft"}
                </span>
              </div>
            </div>

            <label className="grid gap-1 text-sm">
              <span className="text-slate-400">Excerpt (shown in the list and link previews)</span>
              <textarea value={draft.excerpt} onChange={(e) => update("excerpt", e.target.value)} className={input} rows={2} maxLength={500} />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="text-slate-400">Cover image URL (optional)</span>
              <input value={draft.coverUrl} onChange={(e) => update("coverUrl", e.target.value)} className={input} placeholder="https://… or /images/…" />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="text-slate-400">Category (the tab it appears under on the blog page)</span>
                <input
                  value={draft.category}
                  onChange={(e) => update("category", e.target.value)}
                  className={input}
                  list="blog-categories"
                  maxLength={40}
                  placeholder="e.g. Flutter, Native, Architecture"
                />
                <datalist id="blog-categories">
                  {[...new Set(posts.map((p) => p.category).filter(Boolean))].map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-400">Tags (comma separated)</span>
                <input value={draft.tags} onChange={(e) => update("tags", e.target.value)} className={input} placeholder="flutter, ble" />
              </label>
            </div>

            <label className="grid gap-1 text-sm">
              <span className="text-slate-400">LinkedIn post URL (optional — shows “View on LinkedIn” under the post)</span>
              <input
                value={draft.sourceUrl}
                onChange={(e) => update("sourceUrl", e.target.value.trim())}
                className={input}
                placeholder="https://www.linkedin.com/posts/…"
              />
              {!draft.id && draft.publishedAt ? (
                <span className="text-xs text-slate-500">
                  Keeps the original LinkedIn date: {new Date(draft.publishedAt).toLocaleDateString()}
                </span>
              ) : null}
            </label>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
                <div className="flex">
                  {(["write", "preview"] as const).map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setTab(name)}
                      className={`-mb-px border-b-2 px-4 py-2 text-sm capitalize ${
                        tab === name ? "border-sky-400 text-sky-200" : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                {tab === "write" ? (
                  <div className="flex flex-wrap gap-1 pb-1">
                    {TOOLBAR.map((tool) => (
                      <button
                        key={tool.label}
                        type="button"
                        title={tool.title}
                        onClick={() => insert(tool.before, tool.after, tool.placeholder)}
                        className="rounded px-2 py-1 font-mono text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                      >
                        {tool.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              {tab === "write" ? (
                <textarea
                  ref={textareaRef}
                  value={draft.content}
                  onChange={(e) => update("content", e.target.value)}
                  className={`${input} mt-3 min-h-[420px] resize-y font-mono leading-6`}
                  placeholder={"Write in Markdown…\n\n## Section\n\n```dart\nvoid main() => print('hi');\n```"}
                />
              ) : (
                <div className="mt-3 min-h-[420px] rounded-md border border-slate-800 bg-slate-950/60 p-5">
                  {draft.content.trim() ? <Markdown content={draft.content} /> : <p className="text-sm text-slate-500">Nothing to preview yet.</p>}
                </div>
              )}
              <p className="mt-1 text-xs text-slate-500">Markdown · ⌘/Ctrl+S saves</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
              <div className="flex flex-wrap gap-2">
                {draft.status === "published" ? (
                  <>
                    <button type="button" disabled={busy} onClick={() => void save("published")} className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
                      {busy ? "Saving…" : "Update"}
                    </button>
                    <button type="button" disabled={busy} onClick={() => void save("draft")} className={btn}>
                      Unpublish
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" disabled={busy} onClick={() => void save("published")} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
                      {busy ? "Saving…" : "Publish"}
                    </button>
                    <button type="button" disabled={busy} onClick={() => void save("draft")} className={btn}>
                      Save draft
                    </button>
                  </>
                )}
              </div>
              {draft.id ? (
                <button type="button" disabled={busy} onClick={() => void removePost()} className="rounded-md px-3 py-1.5 text-sm text-rose-300 hover:bg-rose-950/50 disabled:opacity-50">
                  Delete post
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {state === "ready" && configured ? (
          <>
            <section className="glass-card mt-8 p-5">
              <h2 className="mb-4 text-lg font-semibold text-sky-200">Posts</h2>
              {posts.length === 0 ? (
                <p className="text-sm text-slate-500">No posts yet — click “New post”.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400">
                        <th className="py-2 pr-3">Title</th>
                        <th className="py-2 pr-3">Category</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Published</th>
                        <th className="py-2 pr-3 text-right">Views</th>
                        <th className="py-2 pr-3 text-right">♥</th>
                        <th className="py-2 text-right">💬</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map((post) => (
                        <tr
                          key={post.id}
                          onClick={() => void openEdit(post.id)}
                          className={`cursor-pointer border-b border-slate-800/80 hover:bg-slate-800/40 ${draft?.id === post.id ? "bg-slate-800/60" : ""}`}
                        >
                          <td className="py-2 pr-3 font-medium text-slate-100">{post.title}</td>
                          <td className="py-2 pr-3 text-slate-300">{post.category || <span className="text-slate-600">—</span>}</td>
                          <td className="py-2 pr-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${
                                post.status === "published" ? "bg-emerald-900/50 text-emerald-200" : "bg-slate-800 text-slate-300"
                              }`}
                            >
                              {post.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap py-2 pr-3 text-slate-400">{fmt(post.publishedAt)}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{post.views}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{post.likes}</td>
                          <td className="py-2 text-right tabular-nums">{post.comments}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="glass-card mt-8 p-5">
              <h2 className="mb-4 text-lg font-semibold text-sky-200">Recent comments</h2>
              {comments.length === 0 ? (
                <p className="text-sm text-slate-500">No comments yet.</p>
              ) : (
                <ul className="divide-y divide-slate-800">
                  {comments.map((c) => (
                    <li key={c.id} className="flex gap-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 text-sm">
                          <span className="font-medium text-slate-100">{c.name}</span>
                          {c.isAuthor ? <span className="text-xs text-sky-300">(you)</span> : null}
                          {c.parentId ? <span className="text-xs text-slate-500">reply</span> : null}
                          <span className="text-xs text-slate-500">on</span>
                          <a href={`/en/blog/${c.postSlug}#comments`} target="_blank" rel="noreferrer" className="truncate text-xs text-sky-300 hover:underline">
                            {c.postTitle}
                          </a>
                          <span className="text-xs text-slate-500">· {fmt(c.createdAt)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-300">{c.body}</p>
                      </div>
                      <button type="button" onClick={() => void removeComment(c.id)} className="h-fit shrink-0 rounded px-2 py-1 text-xs text-rose-300 hover:bg-rose-950/50">
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
