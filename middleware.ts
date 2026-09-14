import createMiddleware from "next-intl/middleware";
import {NextRequest, NextResponse} from "next/server";
import {defaultLocale, locales} from "./src/i18n/routing";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale
});

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

export default function middleware(request: NextRequest) {
  if (isWeddingPath(request.nextUrl.pathname)) {
    return new NextResponse(null, {status: 404});
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|admin|.*\\..*).*)",
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
