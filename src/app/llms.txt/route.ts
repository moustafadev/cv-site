import {defaultLocale} from "@/i18n/routing";
import {listPublishedPosts} from "@/lib/blog";
import {BLOG_PATH, blogPostPath} from "@/lib/blog-constants";
import {hasBlogStore} from "@/lib/blog-db";
import {cvData} from "@/lib/cv-data";
import {absoluteUrl, siteOrigin} from "@/lib/seo";
import {EMAIL, GITHUB_URL, JOB_TITLE, KNOWS_ABOUT, LINKEDIN_URL, ONE_LINER, PERSON_NAME} from "@/lib/site";

// Rebuilt per request from the same registries as the pages (site.ts, cv-data.ts, blog posts), so it can't drift.
export const dynamic = "force-dynamic";

/** /llms.txt (https://llmstxt.org): a curated map of this site for AI agents. Not a substitute for robots/sitemap. */
export async function GET() {
  const origin = await siteOrigin();
  const cv = cvData(defaultLocale);
  const posts = hasBlogStore() ? await listPublishedPosts().catch(() => []) : [];
  const oneLine = (text: string) => text.replace(/\s+/g, " ").trim();

  const lines = [
    `# ${PERSON_NAME}`,
    "",
    `> ${ONE_LINER.en}`,
    "",
    `- Role: ${JOB_TITLE.en}`,
    `- Based in: Cairo, Egypt`,
    `- Experience: ${cv.stats.map((s) => `${s.value} ${s.label.toLowerCase()}`).join(", ")}`,
    `- Core skills: ${KNOWS_ABOUT.join(", ")}`,
    `- Education: ${cv.education.degree}, ${cv.education.school} (${cv.education.period})`,
    `- Languages: ${cv.languages.map((l) => `${l.name} (${l.level})`).join(", ")}`,
    `- Contact: ${EMAIL}`,
    "",
    "## CV",
    "",
    `- [CV (English)](${absoluteUrl(origin, "en")}): experience, projects, skills and FAQ`,
    `- [CV (Russian)](${absoluteUrl(origin, "ru")}): the same CV in Russian`,
    `- [CV PDF (English)](${origin}/Mostafa_Omar_CV_EN.pdf)`,
    `- [CV PDF (Russian)](${origin}/Mostafa_Omar_CV_RU.pdf)`,
    "",
    "## Experience",
    "",
    ...cv.experience.map((e) => `- ${e.role} at ${e.company} (${e.period}): ${oneLine(e.points.join(" "))}`),
    "",
    "## Projects",
    "",
    ...cv.projects.map((p) => {
      const store = p.playUrl || p.appStoreUrl;
      return store ? `- [${p.name}](${store}): ${oneLine(p.desc)}` : `- ${p.name} (private): ${oneLine(p.desc)}`;
    }),
    "",
    "## Blog",
    "",
    `- [All posts](${origin}${BLOG_PATH}): notes on Flutter, mobile engineering and lessons from production`,
    ...posts.slice(0, 50).map((post) => `- [${oneLine(post.title)}](${origin}${blogPostPath(post.slug)})${post.excerpt ? `: ${oneLine(post.excerpt)}` : ""}`),
    "",
    "## Profiles",
    "",
    `- [GitHub](${GITHUB_URL})`,
    `- [LinkedIn](${LINKEDIN_URL})`,
    ""
  ];

  return new Response(lines.join("\n"), {
    headers: {"Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600"}
  });
}
