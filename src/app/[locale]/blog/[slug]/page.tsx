import {cache} from "react";
import type {Metadata} from "next";
import {notFound, permanentRedirect} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {Comments} from "@/components/blog/Comments";
import {LikeButton} from "@/components/blog/LikeButton";
import {Markdown} from "@/components/blog/Markdown";
import {PostImage} from "@/components/blog/PostImage";
import {PostViewTracker} from "@/components/blog/PostViewTracker";
import {ShareButtons} from "@/components/blog/ShareButtons";
import {isLocale} from "@/i18n/routing";
import {BLOG_AUTHOR_NAME, BLOG_LOCALE, getPostPageData} from "@/lib/blog";
import {hasBlogStore} from "@/lib/blog-db";
import {getVisitor, isAdminRequest, siteOrigin, turnstileSiteKey} from "@/lib/blog-request";
import {extractHeadings} from "@/lib/blog-text";

type Params = Promise<{locale: string; slug: string}>;

/** Shared by generateMetadata and the page so the post is fetched once per request. Drafts are admin-only. */
const loadPost = cache(async (slug: string) => {
  if (!hasBlogStore()) return null;
  const [visitor, isAdmin] = await Promise.all([getVisitor(), isAdminRequest()]);
  const data = await getPostPageData(slug, visitor);
  if (!data || (data.post.status !== "published" && !isAdmin)) return null;
  return {...data, isAdmin};
});

export async function generateMetadata({params}: {params: Params}): Promise<Metadata> {
  const {locale, slug} = await params;
  if (locale !== BLOG_LOCALE) return {};
  const data = await loadPost(slug);
  if (!data) return {};
  const {post} = data;
  const origin = await siteOrigin();
  const url = `${origin}/${BLOG_LOCALE}/blog/${post.slug}`;
  const description = post.excerpt || undefined;
  const image = post.coverUrl
    ? {url: new URL(post.coverUrl, origin).toString(), alt: post.title}
    : {url: `${origin}/api/blog/og/${post.slug}`, width: 1200, height: 630, alt: post.title};

  return {
    metadataBase: new URL(origin),
    title: `${post.title} — ${BLOG_AUTHOR_NAME}`,
    description,
    alternates: {canonical: url},
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description,
      siteName: BLOG_AUTHOR_NAME,
      locale: "en_US",
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      modifiedTime: new Date(post.updatedAt).toISOString(),
      authors: [BLOG_AUTHOR_NAME],
      tags: post.tags,
      images: [image]
    },
    twitter: {card: "summary_large_image", title: post.title, description, images: [image.url]},
    robots: post.status === "published" ? undefined : {index: false, follow: false}
  };
}

export default async function BlogPostPage({params}: {params: Params}) {
  const {locale, slug} = await params;
  if (!isLocale(locale)) notFound();
  // The blog is English-only; /ru/blog/… links land on the English post.
  if (locale !== BLOG_LOCALE) permanentRedirect(`/${BLOG_LOCALE}/blog/${encodeURIComponent(slug)}`);
  setRequestLocale(locale);

  const data = await loadPost(slug);
  if (!data) notFound();
  const {post, likedByMe, comments, isAdmin} = data;

  const t = await getTranslations("blog");
  const headings = extractHeadings(post.content);
  const url = `${await siteOrigin()}/${locale}/blog/${post.slug}`;
  const date = new Intl.DateTimeFormat(locale, {dateStyle: "long", timeZone: "UTC"}).format(
    post.publishedAt || post.updatedAt
  );
  // Imported posts use the opening text as the excerpt; don't show it twice.
  const plain = (s: string) => s.replace(/[#*_>`[\]()!-]/g, "").replace(/\s+/g, " ").trim();
  const showExcerpt = Boolean(post.excerpt) && !plain(post.content).startsWith(plain(post.excerpt.replace(/(\.\.\.|…)$/, "")));

  return (
    <main className="container-page py-10">
      {post.status === "published" ? <PostViewTracker postId={post.id} /> : null}
      <article className="mx-auto max-w-3xl fade-up">
        <a href={`/${locale}/blog`} className="text-sm text-slate-400 transition hover:text-sky-300">
          ← {t("allPosts")}
        </a>

        {post.status !== "published" ? (
          <div className="mt-4 rounded-lg border border-amber-700/70 bg-amber-950/40 px-4 py-2 text-sm text-amber-200">
            {t("draftNotice")}
          </div>
        ) : null}

        <header className="mt-6">
          {post.tags.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <a
                  key={tag}
                  href={`/${locale}/blog?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300 transition hover:bg-sky-500/20"
                >
                  #{tag}
                </a>
              ))}
            </div>
          ) : null}
          <h1 dir="auto" className="text-3xl font-bold leading-tight text-slate-50 md:text-5xl md:leading-tight">
            {post.title}
          </h1>
          {showExcerpt ? (
            <p dir="auto" className="mt-4 text-lg leading-8 text-slate-400">
              {post.excerpt}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-400">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/profile-mostafa.png" alt="" className="h-9 w-9 rounded-full border border-slate-700 object-cover" />
            <span className="font-medium text-slate-200">{BLOG_AUTHOR_NAME}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={new Date(post.publishedAt || post.updatedAt).toISOString()}>{date}</time>
            <span aria-hidden="true">·</span>
            <span>{t("minRead", {minutes: post.readingMinutes})}</span>
            <span aria-hidden="true">·</span>
            <span>{t("views", {count: post.views})}</span>
          </div>
        </header>

        {post.coverUrl ? (
          <div className="post-img-row mt-8">
            <PostImage src={post.coverUrl} eager />
          </div>
        ) : null}

        {headings.length >= 3 ? (
          <nav aria-label={t("contents")} className="glass-card mt-8 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("contents")}</p>
            <ol className="mt-3 space-y-1.5 text-sm">
              {headings.map((h) => (
                <li key={h.id} className={h.depth === 3 ? "pl-4" : ""}>
                  <a href={`#${h.id}`} className="text-slate-300 transition hover:text-sky-300">
                    {h.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div className="mt-8">
          <Markdown content={post.content} />
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-y border-slate-800 py-5">
          <div className="flex flex-wrap items-center gap-3">
            <LikeButton postId={post.id} initialLiked={likedByMe} initialCount={post.likes} />
            {post.sourceUrl ? (
              <a
                href={post.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-sky-400 hover:text-sky-200"
              >
                {t("onLinkedIn")} ↗
              </a>
            ) : null}
          </div>
          <ShareButtons url={url} title={post.title} />
        </div>

        <div className="mt-12">
          <Comments
            postId={post.id}
            initialComments={comments}
            isAdmin={isAdmin}
            turnstileSiteKey={turnstileSiteKey()}
          />
        </div>
      </article>
    </main>
  );
}
