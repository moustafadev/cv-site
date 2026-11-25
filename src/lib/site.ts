import type {Locale} from "@/i18n/routing";

// Single source of truth for who this site is about (client-safe constants only). Reused by the CV page, JSON-LD, metadata and /llms.txt,
// so the identity engines see is the same sentence everywhere.

export const PERSON_NAME = "Mostafa Omar";
export const PERSON_NAME_RU = "Мустафа Омар";
export const EMAIL = "mostafaomardev@gmail.com";
export const PHONE = "+20 109 493 0203";
/** Russian number, kept for clients and recruiters in the CIS. */
export const PHONE_ALT = "+7 927 049 2663";
export const GITHUB_URL = "https://github.com/moustafadev";
export const LINKEDIN_URL = "https://www.linkedin.com/in/mostafa-omar-418622170";
/** Only real, owned profiles. Add a URL here only once the profile exists. */
export const SAME_AS = [GITHUB_URL, LINKEDIN_URL];
export const PROFILE_IMAGE = "/profile-mostafa.png";

/**
 * The one address this site is published at. Canonical URLs, hreflang, the sitemap, JSON-LD, share
 * links and /llms.txt are all built from it, so it must never follow the host a request happened to
 * arrive on — www.mostafaomar.tech would otherwise advertise itself as a second, competing site.
 * NEXT_PUBLIC_SITE_URL still overrides it if the domain ever changes.
 */
export const CANONICAL_ORIGIN = "https://mostafaomar.tech";

/** The frozen one-liner: use this exact sentence on LinkedIn, GitHub and any bio too. */
export const ONE_LINER: Record<Locale, string> = {
  en: "Mostafa Omar is a software engineer with 5 years building production iOS and Android apps with Flutter — 30+ apps and over 200,000 downloads — specializing in native Swift, Kotlin and Java integrations, BLE and WebRTC, and building the TypeScript backends his own products run on.",
  ru: "Мустафа Омар — инженер-программист с опытом 5 лет: создаёт продакшн-приложения для iOS и Android на Flutter (30+ приложений, более 200 000 загрузок), специализируется на нативных интеграциях Swift, Kotlin и Java, BLE и WebRTC и сам пишет бэкенды на TypeScript для своих продуктов."
};

export const JOB_TITLE: Record<Locale, string> = {
  en: "Software Engineer · Mobile & Backend",
  ru: "Инженер-программист · Мобильная разработка и бэкенд"
};

export const KNOWS_ABOUT = [
  "Flutter",
  "Dart",
  "iOS development",
  "Android development",
  "Bluetooth Low Energy (BLE)",
  "WebRTC",
  "Swift",
  "Kotlin",
  "Java",
  "Clean Architecture",
  "Riverpod",
  "Bloc",
  "Firebase",
  "TypeScript",
  "Node.js",
  "Next.js",
  "Cloudflare Workers",
  "SQLite",
  "REST API design"
];

export const SITE_ICONS = {
  icon: [{url: PROFILE_IMAGE, type: "image/png"}],
  shortcut: PROFILE_IMAGE,
  apple: PROFILE_IMAGE
};
