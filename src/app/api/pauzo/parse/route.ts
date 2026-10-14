import {NextResponse} from "next/server";
import {consumeAiQuota, getEntitlement, refundAiQuota} from "@/lib/pauzo";
import {coachError} from "@/lib/pauzo-coach-input";
import {parseOperations} from "@/lib/pauzo-parse";
import {cleanString, readJson, requireDevice} from "@/lib/pauzo-request";

// A phone photo compressed by the app is ~200-400KB as base64.
const MAX_BODY_BYTES = 1_500_000;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

/**
 * Understands a sentence or a pasted bank message the app couldn't read on
 * its own (free and premium, counted with the day's AI messages), or a
 * receipt photo (premium only).
 */
export async function POST(request: Request) {
  try {
    const device = await requireDevice(request);
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > MAX_BODY_BYTES) return NextResponse.json({ok: false, error: "too_large"}, {status: 413});
    const raw = await readJson<Record<string, unknown>>(request);
    const text = cleanString(raw.text, 1000);
    const imageRaw = raw.image as Record<string, unknown> | undefined;
    const image =
      imageRaw && typeof imageRaw.base64 === "string" && IMAGE_TYPES.includes(String(imageRaw.mimeType))
        ? {mimeType: String(imageRaw.mimeType), base64: imageRaw.base64}
        : undefined;
    if (!text && !image) return NextResponse.json({ok: false, error: "invalid_input"}, {status: 400});

    const entitlement = await getEntitlement(device);
    if (image && !entitlement.premium) {
      return NextResponse.json({ok: false, error: "premium_required", entitlement}, {status: 402});
    }
    if (!(await consumeAiQuota(device, entitlement.premium))) {
      return NextResponse.json({ok: false, error: "daily_limit", entitlement}, {status: 429});
    }
    let operations;
    try {
      operations = await parseOperations({
        text: text || undefined,
        image,
        locale: cleanString(raw.locale, 20) || "ar-EG",
        today: cleanString(raw.today, 10) || new Date().toISOString().slice(0, 10)
      });
    } catch (error) {
      await refundAiQuota(device);
      throw error;
    }
    if (!operations.length) {
      // Nothing readable: don't charge for it.
      await refundAiQuota(device);
      return NextResponse.json({ok: false, error: "not_understood", entitlement: await getEntitlement(device)}, {status: 422});
    }
    // `operation` keeps apps from before multi-operation replies working.
    return NextResponse.json({
      ok: true,
      operations,
      operation: operations[0],
      entitlement: await getEntitlement(device)
    });
  } catch (error) {
    return coachError(error);
  }
}
