import type {MetadataRoute} from "next";
import {siteOrigin} from "@/lib/seo";

/** AI answer engines and search crawlers we explicitly welcome (GEO): same rules as everyone, stated by name. */
const AI_AND_SEARCH_AGENTS = [
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "YandexBot",
  "DuckDuckBot"
];

const rules = {allow: ["/", "/api/blog/og/"], disallow: ["/admin", "/api/"]};

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await siteOrigin();
  return {
    rules: [
      {userAgent: "*", ...rules},
      {userAgent: AI_AND_SEARCH_AGENTS, ...rules}
    ],
    sitemap: `${origin}/sitemap.xml`
  };
}
