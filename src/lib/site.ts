import type {Locale} from "@/i18n/routing";

// Single source of truth for who this site is about (client-safe constants only). Reused by the CV page, JSON-LD, metadata and /llms.txt,
// so the identity engines see is the same sentence everywhere.

export const PERSON_NAME = "Mostafa Omar";
export const PERSON_NAME_RU = "Мустафа Омар";
export const EMAIL = "mostafaomardev@gmail.com";
export const PHONE = "+20 109 493 0203";
export const GITHUB_URL = "https://github.com/moustafadev";
export const LINKEDIN_URL = "https://www.linkedin.com/in/mostafa-omar-418622170";
/** Only real, owned profiles. Add a URL here only once the profile exists. */
export const SAME_AS = [GITHUB_URL, LINKEDIN_URL];
export const PROFILE_IMAGE = "/profile-mostafa.png";

/** The frozen one-liner: use this exact sentence on LinkedIn, GitHub and any bio too. */
export const ONE_LINER: Record<Locale, string> = {
  en: "Mostafa Omar is a Flutter developer with 4+ years of experience building production iOS and Android apps, specializing in BLE, WebRTC and native Swift, Kotlin and Java integrations.",
  ru: "Мустафа Омар — Flutter-разработчик с опытом более 4 лет: создаёт продакшн-приложения для iOS и Android и специализируется на BLE, WebRTC и нативных интеграциях на Swift, Kotlin и Java."
};

export const JOB_TITLE: Record<Locale, string> = {
  en: "Flutter Developer (iOS & Android)",
  ru: "Flutter-разработчик (iOS и Android)"
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
  "Firebase"
];

export const SITE_ICONS = {
  icon: [{url: PROFILE_IMAGE, type: "image/png"}],
  shortcut: PROFILE_IMAGE,
  apple: PROFILE_IMAGE
};
