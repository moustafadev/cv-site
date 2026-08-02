import {NextResponse} from "next/server";
import {requireAdmin} from "@/lib/require-admin";
import {normalizeWeddingConfig, readWeddingConfig, readWeddingRsvps, writeWeddingConfig} from "@/lib/wedding-store";

export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [config, rsvps] = await Promise.all([readWeddingConfig(), readWeddingRsvps()]);
  return NextResponse.json({
    ok: true,
    config,
    rsvps,
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
  const saved = await writeWeddingConfig(config);
  return NextResponse.json({ok: true, config: saved});
}
