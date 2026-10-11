import {NextResponse} from "next/server";
import {consumeIpQuota, getDevice, getEntitlement, joinPair} from "@/lib/pauzo";
import {cleanString, clientIp, pauzoError, readJson, requireDevice} from "@/lib/pauzo-request";

const JOIN_ATTEMPTS_PER_IP_PER_DAY = 30;

/** «I have a code»: closes the pair and unlocks both phones. */
export async function POST(request: Request) {
  try {
    const device = await requireDevice(request);
    const body = await readJson<{code?: unknown}>(request);
    if (!(await consumeIpQuota(clientIp(request), "join", JOIN_ATTEMPTS_PER_IP_PER_DAY))) {
      return NextResponse.json({ok: false, error: "rate_limited"}, {status: 429});
    }
    const result = await joinPair(device, cleanString(body.code, 12));
    const fresh = (await getDevice(device.id)) ?? device;
    const entitlement = await getEntitlement(fresh);
    if (result !== "joined") {
      return NextResponse.json({ok: false, error: result, entitlement}, {status: 409});
    }
    return NextResponse.json({ok: true, entitlement});
  } catch (error) {
    return pauzoError(error);
  }
}
