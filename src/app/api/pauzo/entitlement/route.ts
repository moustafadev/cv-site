import {NextResponse} from "next/server";
import {getEntitlement, touchDevice} from "@/lib/pauzo";
import {cleanString, pauzoError, requireDevice} from "@/lib/pauzo-request";

/** Called on every app open; the app caches the answer for offline use. */
export async function GET(request: Request) {
  try {
    const device = await requireDevice(request);
    const url = new URL(request.url);
    await touchDevice(device.id, {
      appVersion: cleanString(url.searchParams.get("appVersion"), 30),
      locale: cleanString(url.searchParams.get("locale"), 10),
      fcmToken: cleanString(url.searchParams.get("fcmToken"), 4096)
    });
    return NextResponse.json({ok: true, entitlement: await getEntitlement(device)});
  } catch (error) {
    return pauzoError(error);
  }
}
