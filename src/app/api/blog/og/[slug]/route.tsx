import {ImageResponse} from "next/og";
import {BLOG_AUTHOR_NAME, getPublishedPostBySlug} from "@/lib/blog";

/** 1200×630 link-preview image (WhatsApp, Telegram, LinkedIn…) for posts without a cover. */
export async function GET(_request: Request, {params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  const post = await getPublishedPostBySlug(slug).catch(() => null);
  if (!post) return new Response("Not found", {status: 404});

  const date = new Intl.DateTimeFormat("en", {dateStyle: "long", timeZone: "UTC"}).format(post.publishedAt);
  const minutes = `${post.readingMinutes} min read`;
  // Satori (the image renderer) can't shape right-to-left scripts, so Arabic/Hebrew titles would come out as
  // broken glyphs. Show the tags instead; chat apps print the real title as text next to the image anyway.
  const rtl = /[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufeff]/.test(post.title);
  const headline = rtl ? (post.tags.length ? post.tags.slice(0, 3).map((tag) => `#${tag}`).join("  ") : "Blog") : post.title;
  const titleSize = headline.length > 70 ? 54 : headline.length > 40 ? 64 : 76;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "radial-gradient(circle at 85% 10%, #0c4a6e 0%, #020617 55%)",
          color: "#f1f5f9"
        }}
      >
        <div style={{display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: "#7dd3fc"}}>
          <div style={{width: 14, height: 14, borderRadius: 999, background: "#38bdf8"}} />
          {BLOG_AUTHOR_NAME} · Blog
        </div>
        <div style={{display: "flex", fontSize: titleSize, fontWeight: 700, lineHeight: 1.15, letterSpacing: -1}}>{headline}</div>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 28, color: "#94a3b8"}}>
          <span>
            {date} · {minutes}
          </span>
          <span style={{display: "flex", gap: 12, color: "#7dd3fc"}}>
            {rtl ? null : post.tags.slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}
          </span>
        </div>
      </div>
    ),
    {width: 1200, height: 630, headers: {"Cache-Control": "public, max-age=3600, s-maxage=86400"}}
  );
}
