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
    <div className="flex items-center rounded-full border border-white/10 bg-white/[0.04] p-0.5 text-sm">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          aria-current={link.active ? "page" : undefined}
          className={`rounded-full px-3 py-1 transition ${
            link.active ? "bg-white/10 font-medium text-white" : "text-white/50 hover:text-accent"
          }`}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
