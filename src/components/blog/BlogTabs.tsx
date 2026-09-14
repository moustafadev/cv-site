"use client";

import {useCallback, useLayoutEffect, useMemo, useRef, useState} from "react";
import {useTranslations} from "next-intl";
import {PostCard} from "@/components/blog/PostCard";
import type {PostSummary} from "@/lib/blog";

type Category = {key: string; name: string; count: number};

const ALL = "";

/** Category tabs over the post grid. The active pill slides between tabs and the cards re-enter staggered. */
export function BlogTabs({posts, initialCategory}: {posts: PostSummary[]; initialCategory: string | null}) {
  const t = useTranslations("blog");

  const categories = useMemo(() => {
    const byKey = new Map<string, Category>();
    for (const post of posts) {
      if (!post.category) continue;
      const key = post.category.toLowerCase();
      const entry = byKey.get(key) ?? {key, name: post.category, count: 0};
      entry.count++;
      byKey.set(key, entry);
    }
    return [...byKey.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [posts]);

  const [active, setActive] = useState(() => {
    const wanted = initialCategory?.toLowerCase() ?? ALL;
    return categories.some((c) => c.key === wanted) ? wanted : ALL;
  });
  const visible = active === ALL ? posts : posts.filter((p) => p.category.toLowerCase() === active);

  // Sliding pill: measured from the active tab; until then the tab paints its own background.
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const listRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{left: number; width: number} | null>(null);

  const measure = useCallback(() => {
    const el = tabRefs.current.get(active);
    if (el) setPill({left: el.offsetLeft, width: el.offsetWidth});
  }, [active]);

  useLayoutEffect(() => {
    measure();
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [measure]);

  function select(key: string) {
    if (key === active) return;
    setActive(key);
    tabRefs.current.get(key)?.scrollIntoView({behavior: "smooth", block: "nearest", inline: "nearest"});
    const url = new URL(window.location.href);
    if (key === ALL) url.searchParams.delete("category");
    else url.searchParams.set("category", key);
    window.history.replaceState(null, "", url);
  }

  const tabs = [{key: ALL, name: t("allCategories"), count: posts.length}, ...categories];

  return (
    <>
      {categories.length > 0 ? (
        <div className="-mx-4 mt-8 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
          <div
            ref={listRef}
            role="tablist"
            aria-label={t("categories")}
            className="relative inline-flex min-w-max gap-1 rounded-full border border-slate-800 bg-slate-900/60 p-1"
          >
            {pill ? (
              <span
                aria-hidden="true"
                className="blog-tab-pill absolute bottom-1 top-1 rounded-full bg-sky-500/15 ring-1 ring-sky-400/40"
                style={{left: 0, width: pill.width, transform: `translateX(${pill.left}px)`}}
              />
            ) : null}
            {tabs.map((tab) => {
              const selected = tab.key === active;
              return (
                <button
                  key={tab.key || "all"}
                  ref={(el) => {
                    if (el) tabRefs.current.set(tab.key, el);
                    else tabRefs.current.delete(tab.key);
                  }}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="blog-tabpanel"
                  onClick={() => select(tab.key)}
                  className={`relative z-10 inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
                    selected ? "text-sky-100" : "text-slate-400 hover:text-slate-200"
                  } ${selected && !pill ? "bg-sky-500/15" : ""}`}
                >
                  {tab.name}
                  <span
                    className={`rounded-full px-1.5 text-xs tabular-nums transition-colors ${
                      selected ? "bg-sky-400/20 text-sky-200" : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Re-keyed per tab so the cards replay their entrance animation. */}
      <div
        key={active || "all"}
        id="blog-tabpanel"
        role="tabpanel"
        className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${categories.length > 0 ? "mt-6" : "mt-10"}`}
      >
        {visible.map((post, index) => (
          <div key={post.id} className="blog-card-in flex" style={{animationDelay: `${Math.min(index, 8) * 70}ms`}}>
            <PostCard post={post} eager={index < 3} />
          </div>
        ))}
      </div>
    </>
  );
}
