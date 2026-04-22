"use client";

import {useLocale} from "next-intl";
import {usePathname} from "next/navigation";
import Link from "next/link";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const switchTo = locale === "en" ? "ru" : "en";
  const basePath = pathname.replace(/^\/(en|ru)/, "");

  return (
    <Link
      className="rounded-full border border-slate-700 px-3 py-1 text-sm hover:border-brand-500"
      href={`/${switchTo}${basePath || ""}`}
    >
      {switchTo.toUpperCase()}
    </Link>
  );
}
