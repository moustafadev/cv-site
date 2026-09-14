import {NextResponse} from "next/server";
import {recordPostView} from "@/lib/blog";
import {blogErrorResponse, isAdminRequest} from "@/lib/blog-request";

export async function POST(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  // Your own visits (while logged in to /admin) don't inflate the count.
  if (await isAdminRequest()) return NextResponse.json({ok: true, counted: false});
  try {
    await recordPostView(id);
    return NextResponse.json({ok: true, counted: true});
  } catch (error) {
    return blogErrorResponse(error);
  }
}
