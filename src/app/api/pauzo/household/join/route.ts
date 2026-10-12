import {NextResponse} from "next/server";
import {consumeIpQuota} from "@/lib/pauzo";
import {joinHousehold} from "@/lib/pauzo-household";
import {householdError} from "@/lib/pauzo-household-request";
import {cleanString, clientIp, readJson, requireDevice} from "@/lib/pauzo-request";

/** Joining is free: one premium member is enough to share a budget. */
export async function POST(request: Request) {
  try {
    const device = await requireDevice(request);
    // Codes are short; slow down anyone guessing them.
    if (!(await consumeIpQuota(clientIp(request), "household_join", 20))) {
      return NextResponse.json({ok: false, error: "rate_limited"}, {status: 429});
    }
    const raw = await readJson<Record<string, unknown>>(request);
    const household = await joinHousehold(device, cleanString(raw.code, 20), cleanString(raw.name, 30));
    return NextResponse.json({ok: true, household});
  } catch (error) {
    return householdError(error);
  }
}
