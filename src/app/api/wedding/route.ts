import {NextResponse} from "next/server";
import {readWeddingConfig} from "@/lib/wedding-store";

export const runtime = "nodejs";

export async function GET() {
  const config = await readWeddingConfig();
  return NextResponse.json(
    {ok: true, config},
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
