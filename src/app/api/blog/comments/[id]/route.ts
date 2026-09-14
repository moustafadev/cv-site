import {NextResponse} from "next/server";
import {deleteComment} from "@/lib/blog";
import {blogErrorResponse, getVisitor, isAdminRequest} from "@/lib/blog-request";

export async function DELETE(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  try {
    const deleted = await deleteComment(id, {isAdmin: await isAdminRequest(), visitor: await getVisitor()});
    if (!deleted) return NextResponse.json({ok: false, error: "not_found"}, {status: 404});
    return NextResponse.json({ok: true});
  } catch (error) {
    return blogErrorResponse(error);
  }
}
