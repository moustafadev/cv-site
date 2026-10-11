# Locales & URL architecture

The site has two languages: **English (default)** and **Russian**. The blog is English-only.

## URL map

| Page        | English (default, unprefixed) | Russian              | Notes                                   |
|-------------|-------------------------------|----------------------|-----------------------------------------|
| CV          | `/`                           | `/ru`                | Reciprocal hreflang + `x-default` → `/` |
| Blog index  | `/blog`                       | → 308 to `/blog`     | English-only, no hreflang               |
| Blog post   | `/blog/{slug}`                | → 308 to `/blog/{slug}` | English-only                          |
| Legacy      | `/en/…` → 308 to `/…`         |                      | Old links keep working                  |

- One language per URL; canonical is always the absolute URL of that page in that language.
- Internal routes still live under `src/app/[locale]/…`; next-intl (`localePrefix: "as-needed"`) maps `/` → `en`.
- Build links with `localePath(locale, path)` from `src/i18n/routing.ts` (never hand-write `/en/…`).
- Slugs are English on purpose: the only localized page is the CV home, which has no slug.

## How a visitor gets a language

Resolved in `src/middleware.ts` (must live in `src/` because the app uses a `src/` directory):

1. `/en/…` → **308** to the unprefixed URL.
2. On `/` only, a **human** from a Russian-speaking country (`RU BY KZ KG TJ UZ TM AM AZ MD`, read server-side from
   `CF-IPCountry` / `x-vercel-ip-country`) gets a **307** to `/ru`.
3. The redirect is skipped when:
   - the `locale_pref` cookie exists (set by the EN/RU switcher, so an explicit choice always wins);
   - the user agent is a crawler, AI engine or link-preview bot (Googlebot, Bingbot, GPTBot, OAI-SearchBot,
     ChatGPT-User, ClaudeBot, PerplexityBot, Applebot, YandexBot, TelegramBot, WhatsApp, facebookexternalhit…).
4. next-intl's own Accept-Language detection and cookie are **off** (`localeDetection: false`, `localeCookie: false`).

This is locale routing for humans. It is **not** GEO (see `GEO.md`).

## Where things are

| Concern                         | File                                   |
|---------------------------------|----------------------------------------|
| Locales, prefix mode, `localePath` | `src/i18n/routing.ts`               |
| Country redirect, `/en` 308     | `src/middleware.ts`                    |
| `<html lang>` per locale        | `src/app/[locale]/layout.tsx` → `RootDocument` |
| Canonical / hreflang / OG       | `buildPageMetadata()` in `src/lib/seo.ts` |
| Sitemap with language alternates| `src/app/sitemap.ts`                   |
| Message catalogs                | `messages/en.json`, `messages/ru.json` |
| Catalog parity check            | `npm run check:i18n` (`blog.*` is English-only by design) |

## Adding a locale later (e.g. Arabic)

1. Add it to `locales` in `src/i18n/routing.ts` and create `messages/ar.json` (run `npm run check:i18n`).
2. Add the Arabic branch to `cvData()` (`src/lib/cv-data.ts`), `ONE_LINER` / `JOB_TITLE` (`src/lib/site.ts`) and `faqFor()`.
3. RTL: pass `dir="rtl"` from `RootDocument` for `ar`, and check the CV layout with logical CSS (`ms-`/`me-`).
4. Decide whether its countries should be redirected (add them to the middleware country set).
5. Hreflang and the sitemap pick the new locale up automatically.

Write the Arabic CV natively — don't ship a word-for-word machine translation.
