# Generative Engine Optimization (GEO)

**GEO is structuring content and off-site authority so AI answer engines (ChatGPT, Claude, Perplexity, Gemini,
Copilot, Google AI Overviews) name and cite _Mostafa Omar_ inside their answers.** SEO earns a ranked link; GEO earns
a sentence in the answer people actually read. GEO is **not** the country redirect — that's locale routing.

## The one-liner (frozen)

> Mostafa Omar is a Flutter developer with 4+ years of experience building production iOS and Android apps,
> specializing in BLE, WebRTC and native Swift, Kotlin and Java integrations.

It lives in `ONE_LINER` (`src/lib/site.ts`) and feeds the meta description, `Person` schema and `/llms.txt`.
Use the **same sentence** on LinkedIn (About), GitHub (bio), and any profile or bio you write. Don't rephrase it per site.

## Citation trinity — what every page needs

1. **Identity** — engines must resolve "Mostafa Omar" to one person.
   `Person` JSON-LD with `jobTitle`, `knowsAbout`, `alumniOf`, and `sameAs` = only real profiles (`SAME_AS` in `site.ts`).
2. **Extractability** — a self-contained answer that matches the question.
   The CV has a visible FAQ (`faqFor()` in `src/app/[locale]/page.tsx`) mirrored as `FAQPage` JSON-LD from the same data.
3. **Corroboration** — other sites saying compatible things. See `OFFSITE-CHECKLIST.md`.

## What's on the site

| Surface | Where |
|---|---|
| `Person`, `WebSite`, `ProfilePage`, `FAQPage` JSON-LD | CV (`/`, `/ru`) |
| `Blog`, `BlogPosting` (with `datePublished`/`dateModified`, author → Person), `BreadcrumbList` | `/blog`, `/blog/{slug}` |
| Visible "Updated …" date on posts edited after publishing | post page |
| `robots.txt` — everyone allowed; AI/search bots named explicitly; `/admin` and `/api/` blocked | `src/app/robots.ts` |
| `sitemap.xml` with hreflang alternates + every published post | `src/app/sitemap.ts` |
| `/llms.txt` — generated per request from `site.ts`, `cv-data.ts` and the posts table, so it never drifts | `src/app/llms.txt/route.ts` |
| AI referral tracking: visits from chatgpt.com, perplexity.ai, claude.ai, gemini, copilot (or `utm_source=chatgpt.com`) show as `ai:chatgpt`, `ai:perplexity`… | `/admin` → Recent visits → Source |

All of it is server-rendered HTML (AI crawlers are weak at JavaScript).

## Writing a post or section that gets cited

Under each important heading:

1. **Heading = the question** people type ("How do I call native code from Flutter with Dart FFI?").
2. **First 40–60 words = the direct answer.** No "in this post we will explore…".
3. **Next sentence = the strongest fact** (a number, a named library, a result).
4. Then details, code, edge cases.
5. One claim per short paragraph; paragraphs that make sense on their own (60–100 words).

Also: use concrete facts over adjectives, link to official docs when citing them, and add a short FAQ to long guides.
Never claim things that aren't true (certifications, clients, numbers).

## Weekly prompts (seed list)

Run each weekly in ChatGPT (search on), Claude, Perplexity, Gemini and Copilot; log results in `citation-ledger.csv`.

1. Who is Mostafa Omar, the Flutter developer?
2. Recommend a Flutter developer experienced with Bluetooth Low Energy (BLE).
3. Freelance Flutter developer with WebRTC video-call experience.
4. Flutter developer who can integrate native Swift and Kotlin code.
5. Flutter developer in Cairo, Egypt available for hire.
6. Flutter-разработчик с опытом BLE и WebRTC (Russian).
7. How do I call native C/Objective-C code from Flutter with Dart FFI? (blog topic)
8. Is bloc_signals a good alternative to flutter_bloc? (blog topic)

## Measuring

AI answers vary run to run — one screenshot is noise. Per prompt × engine, log: date, engine + mode, exact prompt,
mentioned? linked? which URL was cited, who else was named, notes. Over a rolling 4 weeks track:

- **Cited rate** = runs where Mostafa Omar is named ÷ runs.
- **Linked rate** = runs with a link to this site ÷ runs.

If a prompt stays uncited: improve the matching answer block / FAQ / post, or earn a corroborating mention; retest in a week.

## Freshness

- CV facts: whenever a job or project changes (update `cv-data.ts`, the PDFs, and LinkedIn the same day).
- Posts: refresh old guides quarterly; the visible "Updated" date and `dateModified` follow automatically.
- After publishing a post: it's in `sitemap.xml` and `/llms.txt` immediately → request indexing in Google Search
  Console and Bing Webmaster Tools → share on LinkedIn → re-run 2–3 related prompts.
