import {NextResponse} from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return new NextResponse(null, {status: 404});
}
