import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const postsDir = path.join(process.cwd(), "src/content/posts");

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  locale: "en" | "ru";
};

export function getPosts(locale: "en" | "ru"): PostMeta[] {
  const files = fs.readdirSync(postsDir).filter((file) => file.endsWith(".mdx"));
  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(postsDir, file), "utf8");
      const {data} = matter(raw);
      return {
        slug: file.replace(".mdx", ""),
        title: data.title as string,
        date: data.date as string,
        locale: data.locale as "en" | "ru"
      };
    })
    .filter((post) => post.locale === locale)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string) {
  const raw = fs.readFileSync(path.join(postsDir, `${slug}.mdx`), "utf8");
  return matter(raw);
}
