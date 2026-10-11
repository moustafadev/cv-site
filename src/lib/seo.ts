import type {Metadata} from "next";
import {headers} from "next/headers";
import {defaultLocale, localePath, locales, type Locale} from "@/i18n/routing";
import {
  EMAIL,
  GITHUB_URL,
  JOB_TITLE,
  KNOWS_ABOUT,
  LINKEDIN_URL,
  ONE_LINER,
  PERSON_NAME,
  PERSON_NAME_RU,
  PROFILE_IMAGE,
  SAME_AS,
  SITE_ICONS
} from "@/lib/site";

/**
 * Public origin for canonical URLs, sitemap, JSON-LD and share links. Set NEXT_PUBLIC_SITE_URL in production;
 * without it the request host is used (which makes the page render per request).
 */
export async function siteOrigin(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Absolute URL of `path` in `locale`. */
export function absoluteUrl(origin: string, locale: Locale, path = ""): string {
  return `${origin}${localePath(locale, path)}`;
}

type PageMetadataInput = {
  locale: Locale;
  /** Path without locale prefix, e.g. "" for the CV, "/blog". */
  path: string;
  title: string;
  description: string;
  /** Page exists in every locale → emit reciprocal hreflang + x-default. */
  localized?: boolean;
  type?: "website" | "profile" | "article";
  image?: {url: string; width?: number; height?: number; alt?: string};
  noindex?: boolean;
  extra?: Partial<Metadata>;
};

/** One helper for every page's canonical, hreflang, Open Graph and Twitter tags. */
export async function buildPageMetadata(input: PageMetadataInput): Promise<Metadata> {
  const origin = await siteOrigin();
  const canonical = absoluteUrl(origin, input.locale, input.path);
  const image = input.image ?? {url: `${origin}${PROFILE_IMAGE}`, width: 800, height: 800, alt: PERSON_NAME};
  const languages = input.localized
    ? {
        ...Object.fromEntries(locales.map((l) => [l, absoluteUrl(origin, l, input.path)])),
        "x-default": absoluteUrl(origin, defaultLocale, input.path)
      }
    : undefined;

  return {
    metadataBase: new URL(origin),
    title: input.title,
    description: input.description,
    icons: SITE_ICONS,
    alternates: {canonical, languages},
    openGraph: {
      type: input.type ?? "website",
      url: canonical,
      title: input.title,
      description: input.description,
      siteName: PERSON_NAME,
      locale: input.locale === "ru" ? "ru_RU" : "en_US",
      alternateLocale: input.localized ? locales.filter((l) => l !== input.locale).map((l) => (l === "ru" ? "ru_RU" : "en_US")) : undefined,
      images: [image]
    },
    twitter: {card: "summary_large_image", title: input.title, description: input.description, images: [image.url]},
    robots: input.noindex ? {index: false, follow: false} : undefined,
    ...input.extra
  };
}

// ---------- JSON-LD ----------

export const personId = (origin: string) => `${origin}/#person`;
export const websiteId = (origin: string) => `${origin}/#website`;

export function personJsonLd(origin: string, locale: Locale) {
  return {
    "@type": "Person",
    "@id": personId(origin),
    name: PERSON_NAME,
    alternateName: PERSON_NAME_RU,
    jobTitle: JOB_TITLE[locale],
    description: ONE_LINER[locale],
    url: absoluteUrl(origin, defaultLocale),
    image: `${origin}${PROFILE_IMAGE}`,
    email: `mailto:${EMAIL}`,
    address: {"@type": "PostalAddress", addressLocality: "Cairo", addressCountry: "EG"},
    knowsAbout: KNOWS_ABOUT,
    knowsLanguage: ["ar", "ru", "en"],
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "Kazan National Research Technical University named after A. N. Tupolev (KNRTU-KAI)"
    },
    sameAs: SAME_AS
  };
}

export function websiteJsonLd(origin: string) {
  return {
    "@type": "WebSite",
    "@id": websiteId(origin),
    name: PERSON_NAME,
    url: absoluteUrl(origin, defaultLocale),
    inLanguage: [...locales],
    publisher: {"@id": personId(origin)}
  };
}

export function breadcrumbJsonLd(items: {name: string; url: string}[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({"@type": "ListItem", position: index + 1, name: item.name, item: item.url}))
  };
}

export function faqJsonLd(items: {q: string; a: string}[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({"@type": "Question", name: item.q, acceptedAnswer: {"@type": "Answer", text: item.a}}))
  };
}

export const OFFICIAL_LINKS = {github: GITHUB_URL, linkedin: LINKEDIN_URL};
