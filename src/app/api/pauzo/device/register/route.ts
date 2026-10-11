import {NextResponse} from "next/server";
import {consumeIpQuota, getEntitlement, registerDevice, TRIAL_DAYS} from "@/lib/pauzo";
import {cleanString, clientIp, pauzoError, readJson} from "@/lib/pauzo-request";

const REGISTERS_PER_IP_PER_DAY = 20;

/** First launch: the app gets its device token and trial end date. */
export async function POST(request: Request) {
  try {
    const body = await readJson<{platform?: unknown; appVersion?: unknown; locale?: unknown}>(request);
    if (!(await consumeIpQuota(clientIp(request), "register", REGISTERS_PER_IP_PER_DAY))) {
      return NextResponse.json({ok: false, error: "rate_limited"}, {status: 429});
    }
    const {device, token} = await registerDevice({
      platform: cleanString(body.platform, 20),
      appVersion: cleanString(body.appVersion, 30),
      locale: cleanString(body.locale, 10)
    });
    return NextResponse.json({
      ok: true,
      deviceId: device.id,
      token,
      trialDays: TRIAL_DAYS,
      entitlement: await getEntitlement(device)
    });
  } catch (error) {
    return pauzoError(error);
  }
}
