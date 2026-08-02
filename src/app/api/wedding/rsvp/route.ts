import {NextResponse} from "next/server";
import {addWeddingRsvp} from "@/lib/wedding-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: {
    name?: string;
    attending?: "yes" | "no";
    message?: string;
    signature?: string | null;
    lang?: "en" | "ar";
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ok: false, error: "invalid_json"}, {status: 400});
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const attending = body.attending === "yes" || body.attending === "no" ? body.attending : null;
  if (!name || !attending) {
    return NextResponse.json({ok: false, error: "invalid_payload"}, {status: 400});
  }

  const row = await addWeddingRsvp({
    name,
    attending,
    message: typeof body.message === "string" ? body.message : "",
    signature: typeof body.signature === "string" ? body.signature : null,
    lang: body.lang === "ar" ? "ar" : "en",
  });

  return NextResponse.json({ok: true, rsvp: {id: row.id, createdAt: row.createdAt}});
}
