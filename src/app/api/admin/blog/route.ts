import {NextResponse} from "next/server";
import {createPost, listAllPosts, listRecentComments, normalizePostInput} from "@/lib/blog";
import {hasBlogStore, isUniqueViolation} from "@/lib/blog-db";
import {blogErrorResponse} from "@/lib/blog-request";
import {requireAdmin} from "@/lib/require-admin";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!hasBlogStore()) return NextResponse.json({ok: true, configured: false, posts: [], comments: []});
  try {
    const [posts, comments] = await Promise.all([listAllPosts(), listRecentComments()]);
    return NextResponse.json({ok: true, configured: true, posts, comments});
  } catch (error) {
    return blogErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = normalizePostInput(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ok: false, error: parsed.error}, {status: 400});
  try {
    const post = await createPost(parsed.value);
    return NextResponse.json({ok: true, post});
  } catch (error) {
    if (isUniqueViolation(error)) return NextResponse.json({ok: false, error: "slug_taken"}, {status: 409});
    return blogErrorResponse(error);
  }
}
