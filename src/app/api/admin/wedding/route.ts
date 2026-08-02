import {NextResponse} from "next/server";
import {requireAdmin} from "@/lib/require-admin";
import {normalizeWeddingConfig, readWeddingConfig, readWeddingRsvps, weddingStorageMode, writeWeddingConfig} from "@/lib/wedding-store";

export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [config, rsvps] = await Promise.all([readWeddingConfig(), readWeddingRsvps()]);
  return NextResponse.json({
    ok: true,
    config,
    rsvps,
    storage: weddingStorageMode(),
    stats: {
      total: rsvps.length,
      yes: rsvps.filter((r) => r.attending === "yes").length,
      no: rsvps.filter((r) => r.attending === "no").length,
    },
  });
}

export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ok: false, error: "invalid_json"}, {status: 400});
  }

  const config = normalizeWeddingConfig(
    typeof body === "object" && body !== null && "config" in body
      ? (body as {config: unknown}).config
      : body
  );

  try {
    const saved = await writeWeddingConfig(config);
    return NextResponse.json({ok: true, config: saved, storage: weddingStorageMode()});
  } catch (error) {
    const message = error instanceof Error ? error.message : "save_failed";
    if (message === "d1_required") {
      return NextResponse.json(
        {
          ok: false,
          error: "d1_required",
          hint: "On Cloudflare, wedding settings must be saved to D1. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, and CLOUDFLARE_API_TOKEN, then redeploy.",
        },
        {status: 503}
      );
    }
    return NextResponse.json({ok: false, error: message}, {status: 500});
  }
}
