"use client";

import {useLocale} from "next-intl";
import {usePathname} from "next/navigation";
import Link from "next/link";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const switchTo = locale === "en" ? "ru" : "en";
  const basePath = pathname.replace(/^\/(en|ru)/, "");
  // The blog has no Russian version, so there's nothing to switch to there.
  if (/^\/blog(\/|$)/.test(basePath)) return null;

  return (
    <Link
      className="rounded-full border border-white/15 px-3 py-1 text-sm text-white/80 transition hover:border-accent hover:text-accent"
      href={`/${switchTo}${basePath || ""}`}
    >
      {switchTo.toUpperCase()}
    </Link>
  );
}
