import {NextResponse} from "next/server";
import {consumeAiQuota, getEntitlement} from "@/lib/pauzo";
import {askGemini, buildPrompt, GeminiError, QUESTIONS, type InsightInput, type QuestionId} from "@/lib/pauzo-insights";
import {cleanString, pauzoError, readJson, requireDevice} from "@/lib/pauzo-request";

const MAX_BODY_BYTES = 8_000;
const CATEGORY_KEYS = new Set(["shopping", "travel", "education", "home", "health", "other"]);

function num(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(n, 1e12)) : 0;
}

function categories(value: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (CATEGORY_KEYS.has(k)) out[k] = num(v);
    }
  }
  return out;
}

function parseInput(raw: Record<string, unknown>): InsightInput | null {
  const question = cleanString(raw.question, 30) as QuestionId;
  if (!QUESTIONS.includes(question)) return null;
  const plan = (raw.plan ?? {}) as Record<string, unknown>;
  const actual = (raw.actual ?? {}) as Record<string, unknown>;
  const previous = raw.previous as Record<string, unknown> | null | undefined;
  const goal = raw.goal as Record<string, unknown> | null | undefined;
  const desire = raw.desire as Record<string, unknown> | null | undefined;
  const limitsRaw = raw.limits as Record<string, Record<string, unknown>> | null | undefined;
  const limits: InsightInput["limits"] = {};
  if (limitsRaw && typeof limitsRaw === "object") {
    for (const [k, v] of Object.entries(limitsRaw)) {
      if (CATEGORY_KEYS.has(k) && v && typeof v === "object") limits[k] = {limit: num(v.limit), spent: num(v.spent)};
    }
  }
  return {
    question,
    locale: cleanString(raw.locale, 10) || "en",
    currency: cleanString(raw.currency, 5) || "USD",
    month: cleanString(raw.month, 7) || "",
    plan: {income: num(plan.income), mandatory: num(plan.mandatory), daily: num(plan.daily), reserve: num(plan.reserve)},
    actual: {income: num(actual.income), expenses: num(actual.expenses), byCategory: categories(actual.byCategory)},
    previous: previous ? {income: num(previous.income), expenses: num(previous.expenses)} : null,
    goal: goal
      ? {
          title: cleanString(goal.title, 60),
          saved: num(goal.saved),
          target: num(goal.target),
          monthly: num(goal.monthly),
          monthsLeft: goal.monthsLeft == null ? null : Math.round(num(goal.monthsLeft))
        }
      : null,
    desire: desire ? {title: cleanString(desire.title, 60), amount: num(desire.amount)} : null,
    limits
  };
}

/** One fixed question about the month; the answer is not stored server-side. */
export async function POST(request: Request) {
  try {
    const device = await requireDevice(request);
    const entitlement = await getEntitlement(device);
    if (entitlement.state === "expired") {
      return NextResponse.json({ok: false, error: "locked"}, {status: 402});
    }
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > MAX_BODY_BYTES) return NextResponse.json({ok: false, error: "too_large"}, {status: 413});
    const input = parseInput(await readJson<Record<string, unknown>>(request));
    if (!input) return NextResponse.json({ok: false, error: "invalid_question"}, {status: 400});
    if (!(await consumeAiQuota(device))) {
      return NextResponse.json({ok: false, error: "daily_limit"}, {status: 429});
    }
    const text = await askGemini(buildPrompt(input));
    return NextResponse.json({ok: true, text});
  } catch (error) {
    if (error instanceof Error && error.message === "gemini_not_configured") {
      return NextResponse.json({ok: false, error: "ai_not_configured"}, {status: 503});
    }
    // The upstream message goes to the Worker log only; the app gets a code.
    if (error instanceof GeminiError) {
      console.error("[pauzo:insights]", error.message);
      return NextResponse.json({ok: false, error: `ai_${error.kind}`}, {status: 502});
    }
    return pauzoError(error);
  }
}
