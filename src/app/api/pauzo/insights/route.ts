import {NextResponse} from "next/server";
import {consumeAiQuota, getEntitlement, refundAiQuota} from "@/lib/pauzo";
import {parseCoachData} from "@/lib/pauzo-coach-input";
import {coachError} from "@/lib/pauzo-coach-input";
import {askGemini, buildPrompt, QUESTIONS, type QuestionId} from "@/lib/pauzo-insights";
import {cleanString, readJson, requireDevice} from "@/lib/pauzo-request";

const MAX_BODY_BYTES = 8_000;

/** One fixed question about the month; free and premium (different daily limits). */
export async function POST(request: Request) {
  try {
    const device = await requireDevice(request);
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > MAX_BODY_BYTES) return NextResponse.json({ok: false, error: "too_large"}, {status: 413});
    const raw = await readJson<Record<string, unknown>>(request);
    const question = cleanString(raw.question, 30) as QuestionId;
    if (!QUESTIONS.includes(question)) {
      return NextResponse.json({ok: false, error: "invalid_question"}, {status: 400});
    }
    const entitlement = await getEntitlement(device);
    if (!(await consumeAiQuota(device, entitlement.premium))) {
      return NextResponse.json({ok: false, error: "daily_limit", entitlement}, {status: 429});
    }
    let text: string;
    try {
      text = await askGemini(buildPrompt({...parseCoachData(raw), question}));
    } catch (error) {
      // A failed answer shouldn't cost one of the day's questions.
      await refundAiQuota(device);
      throw error;
    }
    return NextResponse.json({ok: true, text, entitlement: await getEntitlement(device)});
  } catch (error) {
    return coachError(error);
  }
}
