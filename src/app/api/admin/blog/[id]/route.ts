import {NextResponse} from "next/server";
import {deletePost, getPostById, normalizePostInput, updatePost} from "@/lib/blog";
import {isUniqueViolation} from "@/lib/blog-db";
import {blogErrorResponse} from "@/lib/blog-request";
import {requireAdmin} from "@/lib/require-admin";

type Ctx = {params: Promise<{id: string}>};

export async function GET(_request: Request, {params}: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const {id} = await params;
  try {
    const post = await getPostById(id);
    if (!post) return NextResponse.json({ok: false, error: "not_found"}, {status: 404});
    return NextResponse.json({ok: true, post});
  } catch (error) {
    return blogErrorResponse(error);
  }
}

export async function PUT(request: Request, {params}: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const {id} = await params;
  const parsed = normalizePostInput(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ok: false, error: parsed.error}, {status: 400});
  try {
    const post = await updatePost(id, parsed.value);
    if (!post) return NextResponse.json({ok: false, error: "not_found"}, {status: 404});
    return NextResponse.json({ok: true, post});
  } catch (error) {
    if (isUniqueViolation(error)) return NextResponse.json({ok: false, error: "slug_taken"}, {status: 409});
    return blogErrorResponse(error);
  }
}

export async function DELETE(_request: Request, {params}: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const {id} = await params;
  try {
    await deletePost(id);
    return NextResponse.json({ok: true});
  } catch (error) {
    return blogErrorResponse(error);
  }
}
