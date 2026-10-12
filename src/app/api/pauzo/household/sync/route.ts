import {NextResponse} from "next/server";
import {syncHousehold} from "@/lib/pauzo-household";
import {householdError} from "@/lib/pauzo-household-request";
import {readJson, requireDevice} from "@/lib/pauzo-request";

const MAX_BODY_BYTES = 300_000;

/** Body: {upserts: SharedOp[], deletes: string[], since: number}. */
export async function POST(request: Request) {
  try {
    const device = await requireDevice(request);
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > MAX_BODY_BYTES) return NextResponse.json({ok: false, error: "too_large"}, {status: 413});
    const raw = await readJson<Record<string, unknown>>(request);
    const result = await syncHousehold(device, {
      upserts: Array.isArray(raw.upserts) ? raw.upserts : [],
      deletes: Array.isArray(raw.deletes) ? raw.deletes : [],
      since: Number(raw.since ?? 0)
    });
    return NextResponse.json({ok: true, ...result});
  } catch (error) {
    return householdError(error);
  }
}
