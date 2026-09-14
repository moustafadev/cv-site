"use client";

import {useLocale, useTranslations} from "next-intl";
import {usePathname} from "next/navigation";

/** CV / Blog switch in the header; the current section is highlighted. */
export function SiteNav() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const onBlog = /^\/(en|ru)\/blog(\/|$)/.test(pathname);

  const links = [
    {href: `/${locale}`, label: t("cv"), active: !onBlog},
    // The blog is English-only, so it's the same link from either language of the CV.
    {href: "/en/blog", label: t("blog"), active: onBlog}
  ];

  return (
    <div className="flex items-center rounded-full border border-slate-800 bg-slate-900/60 p-0.5 text-sm">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          aria-current={link.active ? "page" : undefined}
          className={`rounded-full px-3 py-1 transition ${
            link.active ? "bg-slate-800 font-medium text-sky-200" : "text-slate-400 hover:text-sky-300"
          }`}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
