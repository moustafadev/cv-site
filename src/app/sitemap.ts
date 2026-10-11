import type {MetadataRoute} from "next";
import {defaultLocale, locales} from "@/i18n/routing";
import {listPublishedPosts} from "@/lib/blog";
import {BLOG_PATH, blogPostPath} from "@/lib/blog-constants";
import {hasBlogStore} from "@/lib/blog-db";
import {absoluteUrl, siteOrigin} from "@/lib/seo";

// Lists blog posts straight from the database, so it's built per request.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await siteOrigin();
  const cvLanguages = {
    ...Object.fromEntries(locales.map((l) => [l, absoluteUrl(origin, l)])),
    "x-default": absoluteUrl(origin, defaultLocale)
  };

  const posts = hasBlogStore() ? await listPublishedPosts().catch(() => []) : [];
  const latestPost = posts.reduce((max, p) => Math.max(max, p.updatedAt), 0);

  return [
    // The CV in each language, each listing all alternates (reciprocal hreflang).
    ...locales.map((locale) => ({
      url: absoluteUrl(origin, locale),
      changeFrequency: "monthly" as const,
      priority: 1,
      alternates: {languages: cvLanguages}
    })),
    {
      url: `${origin}${BLOG_PATH}`,
      lastModified: latestPost ? new Date(latestPost) : undefined,
      changeFrequency: "weekly",
      priority: 0.8
    },
    ...posts.map((post) => ({
      url: `${origin}${blogPostPath(post.slug)}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7
    }))
  ];
}
