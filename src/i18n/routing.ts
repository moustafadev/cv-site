import {defineRouting} from "next-intl/routing";

export const locales = ["en", "ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/**
 * English is served without a prefix (/, /blog), Russian under /ru. /en/… URLs permanently redirect to the
 * unprefixed ones. next-intl's own Accept-Language detection and cookie are off: the only automatic choice is
 * the country redirect in middleware.ts, which the visitor's explicit language switch (LOCALE_PREF_COOKIE) overrides.
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  localeDetection: false,
  localeCookie: false
});

/** Set by the language switcher; when present the country redirect never runs. */
export const LOCALE_PREF_COOKIE = "locale_pref";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

/** Public path for a page in a locale: localePath("en", "/blog") → "/blog", localePath("ru") → "/ru". */
export function localePath(locale: Locale, path = ""): string {
  const clean = path === "/" ? "" : path;
  return locale === defaultLocale ? clean || "/" : `/${locale}${clean}`;
}
