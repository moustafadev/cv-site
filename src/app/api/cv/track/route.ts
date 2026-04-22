import {NextResponse} from "next/server";
import {recordCvView} from "@/lib/cv-analytics";

export async function POST(request: Request) {
  let body: {path?: string; locale?: string; landingReferrer?: string | null} = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ok: false, error: "invalid_json"}, {status: 400});
  }
  const path = typeof body.path === "string" ? body.path.slice(0, 500) : "";
  if (!path) {
    return NextResponse.json({ok: false, error: "path_required"}, {status: 400});
  }
  const locale = typeof body.locale === "string" ? body.locale.slice(0, 10) : undefined;
  const landingReferrer =
    typeof body.landingReferrer === "string" ? body.landingReferrer.slice(0, 2000) : body.landingReferrer ?? null;
  const userAgent = request.headers.get("user-agent");
  const result = await recordCvView({path, locale, landingReferrer, userAgent});
  return NextResponse.json(result, {status: result.ok ? 200 : 503});
}
