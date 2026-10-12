import {NextResponse} from "next/server";
import {consumeAiQuota, getEntitlement, refundAiQuota} from "@/lib/pauzo";
import {coachError, parseChatMessages, parseCoachData} from "@/lib/pauzo-coach-input";
import {askGemini, buildChat} from "@/lib/pauzo-insights";
import {readJson, requireDevice} from "@/lib/pauzo-request";

// Operations for three months plus the conversation.
const MAX_BODY_BYTES = 64_000;

/** Premium chat about the user's money; counts against the same daily allowance. */
export async function POST(request: Request) {
  try {
    const device = await requireDevice(request);
    const entitlement = await getEntitlement(device);
    if (!entitlement.premium) {
      return NextResponse.json({ok: false, error: "premium_required", entitlement}, {status: 402});
    }
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > MAX_BODY_BYTES) return NextResponse.json({ok: false, error: "too_large"}, {status: 413});
    const raw = await readJson<Record<string, unknown>>(request);
    const messages = parseChatMessages(raw.messages);
    if (!messages) return NextResponse.json({ok: false, error: "invalid_messages"}, {status: 400});
    if (!(await consumeAiQuota(device, true))) {
      return NextResponse.json({ok: false, error: "daily_limit", entitlement}, {status: 429});
    }
    let text: string;
    try {
      text = await askGemini(buildChat(parseCoachData((raw.data ?? {}) as Record<string, unknown>), messages));
    } catch (error) {
      await refundAiQuota(device);
      throw error;
    }
    return NextResponse.json({ok: true, text, entitlement: await getEntitlement(device)});
  } catch (error) {
    return coachError(error);
  }
}
