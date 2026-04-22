import {notFound} from "next/navigation";
import {MDXRemote} from "next-mdx-remote/rsc";
import {setRequestLocale} from "next-intl/server";
import {isLocale} from "@/i18n/routing";
import {getPostBySlug, getPosts} from "@/lib/posts";

export function generateStaticParams() {
  return ["en", "ru"].flatMap((locale) =>
    getPosts(locale as "en" | "ru").map((post) => ({locale, slug: post.slug}))
  );
}

export default async function BlogPost({
  params
}: {
  params: Promise<{locale: string; slug: string}>;
}) {
  const {locale, slug} = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  try {
    const {content, data} = getPostBySlug(slug);
    if (data.locale !== locale) return notFound();

    return (
      <main className="container-page py-10">
        <article className="prose prose-invert max-w-none">
          <h1>{data.title as string}</h1>
          <p>{data.date as string}</p>
          <MDXRemote source={content} />
        </article>
      </main>
    );
  } catch {
    return notFound();
  }
}
