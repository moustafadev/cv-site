"use client";

import {useLocale} from "next-intl";
import {usePathname} from "next/navigation";
import {LOCALE_PREF_COOKIE, isLocale, localePath, type Locale} from "@/i18n/routing";

export function LanguageSwitcher() {
  const current = useLocale();
  const pathname = usePathname();
  const switchTo: Locale = current === "ru" ? "en" : "ru";
  const basePath = pathname.replace(/^\/(en|ru)(?=\/|$)/, "");
  // The blog has no Russian version, so there's nothing to switch to there.
  if (/^\/blog(\/|$)/.test(basePath)) return null;

  return (
    <a
      href={localePath(isLocale(switchTo) ? switchTo : "en", basePath)}
      // An explicit choice wins over the country redirect from now on.
      onClick={() => {
        document.cookie = `${LOCALE_PREF_COOKIE}=${switchTo}; path=/; max-age=31536000; samesite=lax`;
      }}
      hrefLang={switchTo}
      className="rounded-full border border-white/15 px-3 py-1 text-sm text-white/80 transition hover:border-accent hover:text-accent"
    >
      {switchTo.toUpperCase()}
    </a>
  );
}
