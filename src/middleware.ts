import createMiddleware from "next-intl/middleware";
import {NextRequest, NextResponse} from "next/server";
import {LOCALE_PREF_COOKIE, defaultLocale, routing} from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/** Countries whose visitors get the Russian CV by default. */
const RUSSIAN_COUNTRIES = new Set(["RU", "BY", "KZ", "KG", "TJ", "UZ", "TM", "AM", "AZ", "MD"]);

/**
 * Crawlers, AI engines and link-preview fetchers must always see the unprefixed English page at "/",
 * never a country redirect. Most identify as "…bot"; the rest are listed by name.
 */
const NON_HUMAN_AGENT =
  /bot|crawl|spider|slurp|ChatGPT-User|Claude-User|Perplexity-User|anthropic-ai|Google-Extended|Google-InspectionTool|facebookexternalhit|WhatsApp|SkypeUriPreview|Lighthouse|HeadlessChrome/i;

function isWeddingPath(pathname: string) {
  return (
    pathname === "/wedding" ||
    pathname.startsWith("/wedding/") ||
    pathname === "/admin/wedding" ||
    pathname.startsWith("/admin/wedding/") ||
    pathname === "/api/wedding" ||
    pathname.startsWith("/api/wedding/") ||
    pathname === "/api/admin/wedding" ||
    pathname.startsWith("/api/admin/wedding/") ||
    /^\/[a-z]{2}\/wedding(\/|$)/i.test(pathname)
  );
}

/** Human visitors from Russian-speaking countries landing on "/" go to /ru, unless they picked a language before. */
function countryRedirect(request: NextRequest): NextResponse | null {
  if (request.nextUrl.pathname !== "/") return null;
  if (request.cookies.has(LOCALE_PREF_COOKIE)) return null;
  const agent = request.headers.get("user-agent") ?? "";
  if (!agent || NON_HUMAN_AGENT.test(agent)) return null;
  // Server-side country only (Cloudflare, then Vercel); never trust anything the client sends.
  const country = (request.headers.get("cf-ipcountry") ?? request.headers.get("x-vercel-ip-country") ?? "").toUpperCase();
  if (!RUSSIAN_COUNTRIES.has(country)) return null;
  const url = request.nextUrl.clone();
  url.pathname = "/ru";
  const response = NextResponse.redirect(url, 307);
  response.headers.set("Vary", "Cookie, User-Agent, CF-IPCountry");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

/** /en/… moved to unprefixed URLs for good: 308 (permanent), where next-intl on its own would answer 307. */
function legacyDefaultLocaleRedirect(request: NextRequest): NextResponse | null {
  const {pathname} = request.nextUrl;
  const prefix = `/${defaultLocale}`;
  if (pathname !== prefix && !pathname.startsWith(`${prefix}/`)) return null;
  const url = request.nextUrl.clone();
  url.pathname = pathname.slice(prefix.length) || "/";
  return NextResponse.redirect(url, 308);
}

export default function middleware(request: NextRequest) {
  if (isWeddingPath(request.nextUrl.pathname)) {
    return new NextResponse(null, {status: 404});
  }
  return legacyDefaultLocaleRedirect(request) ?? countryRedirect(request) ?? intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|admin|pauzo|.*\\..*).*)",
    "/wedding",
    "/wedding/:path*",
    "/admin/wedding",
    "/admin/wedding/:path*",
    "/api/wedding",
    "/api/wedding/:path*",
    "/api/admin/wedding",
    "/api/admin/wedding/:path*"
  ]
};
