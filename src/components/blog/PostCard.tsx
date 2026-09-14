import {useTranslations} from "next-intl";
import type {PostSummary} from "@/lib/blog";
import {BLOG_AUTHOR_NAME, BLOG_LOCALE} from "@/lib/blog-constants";

const formatDate = new Intl.DateTimeFormat(BLOG_LOCALE, {dateStyle: "medium", timeZone: "UTC"});

/** Blog list card. Every card is the same size; the image sits in the same 16:10 frame as inside posts, shown whole. */
export function PostCard({post, eager = false}: {post: PostSummary; eager?: boolean}) {
  const t = useTranslations("blog");

  return (
    <a href={`/${BLOG_LOCALE}/blog/${post.slug}`} className="glass-card hover-lift group flex w-full flex-col overflow-hidden">
      <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden border-b border-slate-800 bg-slate-900">
        {post.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverUrl}
            alt=""
            loading={eager ? "eager" : "lazy"}
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : (
          <span className="text-sm font-medium text-sky-300/80">
            {post.category || (post.tags[0] ? `#${post.tags[0]}` : BLOG_AUTHOR_NAME)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
          {post.category ? (
            <>
              <span className="font-medium text-sky-300">{post.category}</span>
              <span aria-hidden="true">·</span>
            </>
          ) : null}
          <time dateTime={new Date(post.publishedAt).toISOString()}>{formatDate.format(post.publishedAt)}</time>
          <span aria-hidden="true">·</span>
          <span>{t("minRead", {minutes: post.readingMinutes})}</span>
        </div>
        <h2 dir="auto" className="mt-2 text-lg font-semibold leading-snug text-slate-50 transition group-hover:text-sky-200">
          {post.title}
        </h2>
        {post.excerpt ? (
          <p dir="auto" className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">
            {post.excerpt}
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tagName) => (
              <span key={tagName} className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
                #{tagName}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1" title={t("like")}>
              <span className="text-rose-400" aria-hidden="true">
                ♥
              </span>
              {post.likes}
            </span>
            <span className="inline-flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2" aria-hidden="true">
                <path strokeLinejoin="round" d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
              </svg>
              {post.comments}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
