import {notFound} from "next/navigation";
import {MDXRemote} from "next-mdx-remote/rsc";
import {setRequestLocale} from "next-intl/server";
import {getPostBySlug, getPosts} from "@/lib/posts";

export function generateStaticParams() {
  return ["en", "ru"].flatMap((locale) =>
    getPosts(locale as "en" | "ru").map((post) => ({locale, slug: post.slug}))
  );
}

export default function BlogPost({params}: {params: {locale: "en" | "ru"; slug: string}}) {
  setRequestLocale(params.locale);
  try {
    const {content, data} = getPostBySlug(params.slug);
    if (data.locale !== params.locale) return notFound();

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
