import {NextResponse} from "next/server";
import {addComment, BLOG_AUTHOR_NAME, countRecentComments} from "@/lib/blog";
import {
  attachVisitorCookie,
  blogErrorResponse,
  clientIp,
  getOrCreateVisitor,
  hashIp,
  isAdminRequest,
  verifyTurnstile
} from "@/lib/blog-request";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const MAX_LINKS = 3;

type Body = {name?: unknown; body?: unknown; parentId?: unknown; website?: unknown; turnstileToken?: unknown};

const fail = (error: string, status = 400) => NextResponse.json({ok: false, error}, {status});

export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id: postId} = await params;
  const input = (await request.json().catch(() => null)) as Body | null;
  if (!input) return fail("invalid_body");

  // Honeypot: bots fill every field. Pretend it worked so they don't retry.
  if (typeof input.website === "string" && input.website.trim()) {
    return NextResponse.json({ok: true, comment: null});
  }

  const isAdmin = await isAdminRequest();
  const name = isAdmin ? BLOG_AUTHOR_NAME : typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : "";
  const body = typeof input.body === "string" ? input.body.trim().replace(/\n{3,}/g, "\n\n") : "";
  const parentId = typeof input.parentId === "string" && input.parentId ? input.parentId : null;

  if (name.length < 2 || name.length > 60) return fail("invalid_name");
  if (!body || body.length > 2000) return fail("invalid_body");
  if ((body.match(/https?:\/\//gi)?.length ?? 0) > MAX_LINKS) return fail("too_many_links");

  const ip = clientIp(request);
  const ipHash = await hashIp(ip);

  try {
    if (!isAdmin) {
      const turnstileToken = typeof input.turnstileToken === "string" ? input.turnstileToken : "";
      if (!(await verifyTurnstile(turnstileToken, ip))) return fail("captcha_failed", 403);
      if ((await countRecentComments(ipHash, Date.now() - RATE_WINDOW_MS)) >= RATE_MAX) {
        return fail("rate_limited", 429);
      }
    }

    const v = await getOrCreateVisitor();
    const result = await addComment({postId, parentId, name, body, isAuthor: isAdmin, visitor: v.visitor, ipHash});
    if (!result.ok) return fail(result.error, 404);
    return attachVisitorCookie(NextResponse.json({ok: true, comment: result.comment}), v);
  } catch (error) {
    return blogErrorResponse(error);
  }
}
