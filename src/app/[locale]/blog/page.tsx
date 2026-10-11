import type {Metadata} from "next";
import {notFound, permanentRedirect} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {defaultLocale, isLocale} from "@/i18n/routing";
import {BlogTabs} from "@/components/blog/BlogTabs";
import {JsonLd} from "@/components/JsonLd";
import {BLOG_AUTHOR_NAME, BLOG_LOCALE, listPublishedPosts, type PostSummary} from "@/lib/blog";
import {BLOG_PATH, blogPostPath} from "@/lib/blog-constants";
import {hasBlogStore} from "@/lib/blog-db";
import {absoluteUrl, breadcrumbJsonLd, buildPageMetadata, personId, siteOrigin} from "@/lib/seo";

type Props = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{tag?: string | string[]; category?: string | string[]}>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({locale: BLOG_LOCALE, namespace: "blog"});
  return buildPageMetadata({
    locale: BLOG_LOCALE,
    path: BLOG_PATH,
    title: `${t("title")} — ${BLOG_AUTHOR_NAME}`,
    description: t("subtitle")
  });
}

async function loadPosts(tag?: string): Promise<PostSummary[]> {
  if (!hasBlogStore()) return [];
  try {
    return await listPublishedPosts(tag);
  } catch (error) {
    console.error("[blog] list failed", error);
    return [];
  }
}

export default async function BlogIndexPage({params, searchParams}: Props) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim().toLowerCase() || undefined;
  const tag = first(query.tag);
  const category = first(query.category) ?? null;
  // The blog is English-only; /ru/blog links land on the English version.
  if (locale !== BLOG_LOCALE) {
    const qs = new URLSearchParams({...(tag ? {tag} : {}), ...(category ? {category} : {})}).toString();
    permanentRedirect(`${BLOG_PATH}${qs ? `?${qs}` : ""}`);
  }
  setRequestLocale(locale);

  const t = await getTranslations("blog");
  const posts = await loadPosts(tag);
  const origin = await siteOrigin();

  return (
    <main className="container-page py-10">
      <JsonLd
        data={{
          "@graph": [
            {
              "@type": "Blog",
              "@id": `${origin}${BLOG_PATH}#blog`,
              name: `${t("title")} — ${BLOG_AUTHOR_NAME}`,
              description: t("subtitle"),
              url: `${origin}${BLOG_PATH}`,
              inLanguage: BLOG_LOCALE,
              author: {"@id": personId(origin)},
              blogPost: posts.slice(0, 50).map((post) => ({
                "@type": "BlogPosting",
                headline: post.title,
                url: `${origin}${blogPostPath(post.slug)}`,
                datePublished: new Date(post.publishedAt).toISOString(),
                dateModified: new Date(post.updatedAt).toISOString()
              }))
            },
            breadcrumbJsonLd([
              {name: BLOG_AUTHOR_NAME, url: absoluteUrl(origin, defaultLocale)},
              {name: t("title"), url: `${origin}${BLOG_PATH}`}
            ])
          ]
        }}
      />
      <header className="fade-up">
        <h1 className="text-4xl font-bold text-slate-50 md:text-5xl">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-slate-400">{t("subtitle")}</p>
        {tag ? (
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-sky-500/10 px-3 py-1 font-medium text-sky-300">{t("filteredBy", {tag: `#${tag}`})}</span>
            <a href={BLOG_PATH} className="text-slate-400 transition hover:text-sky-300">
              ✕ {t("allPosts")}
            </a>
          </div>
        ) : null}
      </header>

      {posts.length === 0 ? (
        <p className="glass-card mt-10 p-8 text-center text-slate-400">{tag ? t("emptyTag") : t("empty")}</p>
      ) : (
        <BlogTabs posts={posts} initialCategory={category} />
      )}
    </main>
  );
}
