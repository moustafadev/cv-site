import {NextResponse} from "next/server";
import {createPairCode, getDevice, getEntitlement} from "@/lib/pauzo";
import {pauzoError, requireDevice} from "@/lib/pauzo-request";

/** «Send to a friend»: returns this device's code (the same one every time). */
export async function POST(request: Request) {
  try {
    const device = await requireDevice(request);
    const code = await createPairCode(device);
    const fresh = (await getDevice(device.id)) ?? device;
    return NextResponse.json({ok: true, code, entitlement: await getEntitlement(fresh)});
  } catch (error) {
    return pauzoError(error);
  }
}
