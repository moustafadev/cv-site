import {NextResponse} from "next/server";
import {getDevice, getEntitlement, recordPurchase} from "@/lib/pauzo";
import {verifyApplePurchase, verifyGooglePurchase} from "@/lib/pauzo-purchase";
import {cleanString, pauzoError, readJson, requireDevice} from "@/lib/pauzo-request";

/** «Unlock on your own»: the app sends the store receipt, the server asks the store. */
export async function POST(request: Request) {
  try {
    const device = await requireDevice(request);
    const body = await readJson<{platform?: unknown; productId?: unknown; purchaseToken?: unknown; transactionId?: unknown}>(request);
    const platform = cleanString(body.platform, 10);
    const productId = cleanString(body.productId, 100);
    const check =
      platform === "android"
        ? await verifyGooglePurchase(productId, cleanString(body.purchaseToken, 2000))
        : platform === "ios"
          ? await verifyApplePurchase(productId, cleanString(body.transactionId, 40))
          : ({ok: false, error: "invalid_platform"} as const);
    if (!check.ok) {
      const status = check.error === "purchase_not_configured" ? 503 : 409;
      return NextResponse.json({ok: false, error: check.error, entitlement: await getEntitlement(device)}, {status});
    }
    const result = await recordPurchase(device, {platform, productId, transactionId: check.purchase.transactionId});
    const fresh = (await getDevice(device.id)) ?? device;
    if (result !== "paid") {
      return NextResponse.json({ok: false, error: result, entitlement: await getEntitlement(fresh)}, {status: 409});
    }
    return NextResponse.json({ok: true, entitlement: await getEntitlement(fresh)});
  } catch (error) {
    return pauzoError(error);
  }
}
