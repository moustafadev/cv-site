import {NextResponse} from "next/server";
import {findPostIdByLinkedInActivity, uniqueSlug} from "@/lib/blog";
import {blogErrorResponse} from "@/lib/blog-request";
import {fetchLinkedInPost, LinkedInImportError, linkedInPostToDraft} from "@/lib/linkedin-import";
import {requireAdmin} from "@/lib/require-admin";

/** Fetches a public LinkedIn post and returns an unsaved draft for the editor (nothing is written here). */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = (await request.json().catch(() => null)) as {url?: unknown} | null;
  const url = typeof body?.url === "string" ? body.url : "";

  try {
    const post = await fetchLinkedInPost(url);
    const existingId = await findPostIdByLinkedInActivity(post.activityId);
    if (existingId) return NextResponse.json({ok: true, existingId});
    const draft = linkedInPostToDraft(post);
    draft.slug = await uniqueSlug(draft.slug);
    return NextResponse.json({ok: true, draft, author: post.author, imageCount: post.images.length});
  } catch (error) {
    if (error instanceof LinkedInImportError) {
      return NextResponse.json({ok: false, error: `linkedin_${error.code}`}, {status: error.code === "invalid_url" ? 400 : 502});
    }
    return blogErrorResponse(error);
  }
}
