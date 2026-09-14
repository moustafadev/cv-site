import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import {common} from "lowlight";
import dart from "highlight.js/lib/languages/dart";
import "highlight.js/styles/github-dark.css";
import {PostImage} from "@/components/blog/PostImage";

const languages = {...common, dart};

// Posts can mix Arabic and English: each block picks its own direction from its first strong character.
const autoDir = <T extends keyof React.JSX.IntrinsicElements>(Tag: T) =>
  function AutoDir({node: _node, ...props}: React.ComponentProps<T> & {node?: unknown}) {
    const Component = Tag as React.ElementType;
    return <Component dir="auto" {...props} />;
  };

/** Renders post Markdown. Raw HTML in the source is ignored (react-markdown default), so content can't inject scripts. */
export function Markdown({content}: {content: string}) {
  return (
    <div className="prose prose-invert prose-slate max-w-none prose-headings:scroll-mt-24 prose-a:text-sky-300 prose-pre:border prose-pre:border-slate-800 prose-pre:bg-slate-900">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, [rehypeHighlight, {languages, detect: false}]]}
        components={{
          p: autoDir("p"),
          li: autoDir("li"),
          ul: autoDir("ul"),
          ol: autoDir("ol"),
          h2: autoDir("h2"),
          h3: autoDir("h3"),
          h4: autoDir("h4"),
          blockquote: autoDir("blockquote"),
          a: ({href, children}) => {
            const external = typeof href === "string" && /^https?:\/\//.test(href);
            return (
              <a href={href} {...(external ? {target: "_blank", rel: "noopener noreferrer"} : {})}>
                {children}
              </a>
            );
          },
          img: ({src, alt}) => (typeof src === "string" ? <PostImage src={src} alt={alt ?? ""} /> : null)
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
