import {cookies, headers} from "next/headers";
import {NextResponse} from "next/server";
import {ADMIN_COOKIE, verifyAdminToken} from "@/lib/admin-session";
import {BlogNotConfiguredError} from "@/lib/blog-db";

export function blogErrorResponse(error: unknown): NextResponse {
  if (error instanceof BlogNotConfiguredError) {
    return NextResponse.json({ok: false, error: "blog_not_configured"}, {status: 503});
  }
  console.error("[blog]", error);
  return NextResponse.json({ok: false, error: "server_error"}, {status: 500});
}

/** Anonymous per-browser id so a visitor can like once and delete their own comments. */
export const VISITOR_COOKIE = "blog_vid";
const VISITOR_PATTERN = /^[0-9a-f-]{36}$/;

export async function getVisitor(): Promise<string | null> {
  const value = (await cookies()).get(VISITOR_COOKIE)?.value;
  return value && VISITOR_PATTERN.test(value) ? value : null;
}

/** Existing visitor id, or a fresh one that `attachVisitorCookie` must persist on the response. */
export async function getOrCreateVisitor(): Promise<{visitor: string; isNew: boolean}> {
  const existing = await getVisitor();
  return existing ? {visitor: existing, isNew: false} : {visitor: crypto.randomUUID(), isNew: true};
}

export function attachVisitorCookie(res: NextResponse, v: {visitor: string; isNew: boolean}): NextResponse {
  if (v.isNew) {
    res.cookies.set(VISITOR_COOKIE, v.visitor, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 2
    });
  }
  return res;
}

export async function isAdminRequest(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return verifyAdminToken(process.env.ADMIN_SESSION_SECRET?.trim(), token);
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    ""
  );
}

/** Salted hash so rate limiting works without storing raw IPs. */
export async function hashIp(ip: string): Promise<string> {
  const salt = process.env.ADMIN_SESSION_SECRET?.trim() || "blog";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return Array.from(new Uint8Array(digest).slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function turnstileSiteKey(): string | null {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null;
}

/** Cloudflare Turnstile check; skipped when TURNSTILE_SECRET_KEY is not set. */
export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({secret, response: token});
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {method: "POST", body});
    const json = (await res.json()) as {success?: boolean};
    return json.success === true;
  } catch {
    return false;
  }
}

/** Public origin for share links and Open Graph URLs. */
export async function siteOrigin(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
