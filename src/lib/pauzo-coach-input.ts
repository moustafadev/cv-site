import {NextResponse} from "next/server";
import {GeminiError, type ChatMessage, type CoachData} from "@/lib/pauzo-insights";
import {cleanString, pauzoError} from "@/lib/pauzo-request";

/** Validates and caps what the app sends to the coach. */

const CATEGORY_KEYS = new Set(["shopping", "travel", "education", "home", "health", "other"]);
const MAX_OPERATIONS = 300;
const MAX_HISTORY = 6;
export const MAX_CHAT_MESSAGES = 12;
export const MAX_CHAT_MESSAGE_CHARS = 600;

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

export function parseCoachData(raw: Record<string, unknown>): CoachData {
  const plan = (raw.plan ?? {}) as Record<string, unknown>;
  const actual = (raw.actual ?? {}) as Record<string, unknown>;
  const previous = raw.previous as Record<string, unknown> | null | undefined;
  const goal = raw.goal as Record<string, unknown> | null | undefined;
  const desire = raw.desire as Record<string, unknown> | null | undefined;
  const limitsRaw = raw.limits as Record<string, Record<string, unknown>> | null | undefined;
  const limits: CoachData["limits"] = {};
  if (limitsRaw && typeof limitsRaw === "object") {
    for (const [k, v] of Object.entries(limitsRaw)) {
      if (CATEGORY_KEYS.has(k) && v && typeof v === "object") limits[k] = {limit: num(v.limit), spent: num(v.spent)};
    }
  }
  const history = Array.isArray(raw.history)
    ? (raw.history as Record<string, unknown>[]).slice(-MAX_HISTORY).map((h) => ({
        month: cleanString(h?.month, 7),
        income: num(h?.income),
        expenses: num(h?.expenses)
      }))
    : [];
  const operations = Array.isArray(raw.operations)
    ? (raw.operations as Record<string, unknown>[]).slice(0, MAX_OPERATIONS).flatMap((o) => {
        const category = cleanString(o?.category, 20);
        const type = o?.type === "income" ? "income" : o?.type === "expense" ? "expense" : null;
        const date = cleanString(o?.date, 10);
        if (!type || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
        return [
          {
            date,
            type,
            category: CATEGORY_KEYS.has(category) ? category : "other",
            amount: num(o?.amount),
            recurring: o?.recurring === true
          } as const
        ];
      })
    : [];
  return {
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
    limits,
    history,
    operations
  };
}

/** Last [MAX_CHAT_MESSAGES] turns, each capped; the last one must be the user's. */
export function parseChatMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw)) return null;
  const messages = raw
    .slice(-MAX_CHAT_MESSAGES)
    .map((m) => ({
      role: (m as Record<string, unknown>)?.role === "model" ? ("model" as const) : ("user" as const),
      text: cleanString((m as Record<string, unknown>)?.text, MAX_CHAT_MESSAGE_CHARS)
    }))
    .filter((m) => m.text);
  if (!messages.length || messages[messages.length - 1]!.role !== "user") return null;
  // Gemini wants the conversation to start with the user.
  while (messages.length && messages[0]!.role !== "user") messages.shift();
  return messages;
}

/** AI failures as codes the app understands; details only in the Worker log. */
export function coachError(error: unknown): NextResponse {
  if (error instanceof Error && error.message === "gemini_not_configured") {
    return NextResponse.json({ok: false, error: "ai_not_configured"}, {status: 503});
  }
  if (error instanceof GeminiError) {
    console.error("[pauzo:coach]", error.message);
    return NextResponse.json({ok: false, error: `ai_${error.kind}`}, {status: 502});
  }
  return pauzoError(error);
}
