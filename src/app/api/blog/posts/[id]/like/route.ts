import {NextResponse} from "next/server";
import {setLike} from "@/lib/blog";
import {attachVisitorCookie, blogErrorResponse, getOrCreateVisitor} from "@/lib/blog-request";

export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const body = (await request.json().catch(() => null)) as {liked?: unknown} | null;
  if (typeof body?.liked !== "boolean") {
    return NextResponse.json({ok: false, error: "invalid_body"}, {status: 400});
  }
  const v = await getOrCreateVisitor();
  try {
    const result = await setLike(id, v.visitor, body.liked);
    if (!result) return NextResponse.json({ok: false, error: "not_found"}, {status: 404});
    return attachVisitorCookie(NextResponse.json({ok: true, ...result}), v);
  } catch (error) {
    return blogErrorResponse(error);
  }
}
