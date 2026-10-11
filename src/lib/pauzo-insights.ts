/**
 * Fixed questions the app can ask about the user's month. The app sends
 * aggregates only (no comments, no free text); the model never sees a
 * transaction list, and nothing is stored here.
 */

export const QUESTIONS = [
  "month_summary",
  "how_to_save",
  "can_i_buy",
  "goal_eta",
  "vs_last_month",
  "plan_review"
] as const;
export type QuestionId = (typeof QUESTIONS)[number];

export type InsightInput = {
  question: QuestionId;
  /** BCP-47 tag the answer must be written in, e.g. ar-EG, ar, en, ru. */
  locale: string;
  currency: string;
  month: string;
  plan: {income: number; mandatory: number; daily: number; reserve: number};
  actual: {income: number; expenses: number; byCategory: Record<string, number>};
  previous?: {income: number; expenses: number} | null;
  goal?: {title: string; saved: number; target: number; monthly: number; monthsLeft: number | null} | null;
  desire?: {title: string; amount: number} | null;
  limits?: Record<string, {limit: number; spent: number}> | null;
};

const LANGUAGE_NAMES: Record<string, string> = {
  "ar-EG": "Egyptian Arabic (colloquial, as spoken in Cairo)",
  ar: "Modern Standard Arabic",
  en: "English",
  ru: "Russian"
};

const QUESTION_TASKS: Record<QuestionId, string> = {
  month_summary:
    "Summarise this month: where the money went, the biggest categories, and how spending compares with the plan. End with one sentence on whether the month is on track.",
  how_to_save:
    "Give three concrete, realistic ways to save next month, each tied to a category in the data with an estimated amount. No generic advice.",
  can_i_buy:
    "The user is thinking about buying the item in `desire`. Say whether it fits this month's free amount and what it does to the goal, then give a clear recommendation: buy now, wait, or skip.",
  goal_eta:
    "Estimate when the goal will be reached at the current monthly contribution, and what contribution would reach it one month sooner. If there is no goal, say so and suggest setting one.",
  vs_last_month:
    "Compare this month with the previous month: income, expenses, and what changed most. If there is no previous month, say that a comparison needs one more month.",
  plan_review:
    "Review the plan numbers against actual spending: is the daily budget realistic, is the reserve enough, is anything consistently over? Suggest at most two adjustments with amounts."
};

function money(value: number, currency: string): string {
  return `${Math.round(value).toLocaleString("en-US")} ${currency}`;
}

export function buildPrompt(input: InsightInput): {system: string; user: string} {
  const language = LANGUAGE_NAMES[input.locale] ?? LANGUAGE_NAMES[input.locale.split("-")[0]!] ?? "English";
  const c = input.currency;
  const free = input.plan.income - input.plan.mandatory - input.plan.daily - input.plan.reserve;
  const lines = [
    `Month: ${input.month}`,
    `Plan: income ${money(input.plan.income, c)}, fixed expenses ${money(input.plan.mandatory, c)}, everyday spending ${money(input.plan.daily, c)}, set aside ${money(input.plan.reserve, c)}, free for goals and wishes ${money(free, c)}`,
    `Actual so far: income ${money(input.actual.income, c)}, expenses ${money(input.actual.expenses, c)}`,
    `Expenses by category: ${
      Object.entries(input.actual.byCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `${k} ${money(v, c)}`)
        .join(", ") || "none yet"
    }`
  ];
  if (input.previous) {
    lines.push(`Previous month: income ${money(input.previous.income, c)}, expenses ${money(input.previous.expenses, c)}`);
  }
  if (input.goal) {
    const g = input.goal;
    lines.push(
      `Main goal: "${g.title}", saved ${money(g.saved, c)} of ${money(g.target, c)}, contributing ${money(g.monthly, c)} per month${
        g.monthsLeft == null ? "" : `, ${g.monthsLeft} months to the target date`
      }`
    );
  }
  if (input.desire) lines.push(`Wish being considered: "${input.desire.title}" for ${money(input.desire.amount, c)}`);
  if (input.limits && Object.keys(input.limits).length) {
    lines.push(
      `Category limits: ${Object.entries(input.limits)
        .map(([k, v]) => `${k} ${money(v.spent, c)} of ${money(v.limit, c)}`)
        .join(", ")}`
    );
  }

  const system = [
    "You are the money coach inside Pauzo, a personal budgeting app.",
    `Write in ${language}. Keep it under 120 words, friendly and direct, plain text with short paragraphs or a short list; no markdown headings, no emojis.`,
    "Use only the numbers given. Never invent transactions, never give investment, loan or tax advice, and never ask the user for more data.",
    `Amounts are in ${c}; write them with digits.`
  ].join(" ");

  return {system, user: `${QUESTION_TASKS[input.question]}\n\nData:\n${lines.join("\n")}`};
}

export class GeminiError extends Error {
  constructor(
    public readonly kind: string,
    detail: string
  ) {
    super(`gemini_${kind}: ${detail}`);
  }
}

export async function askGemini(prompt: {system: string; user: string}): Promise<string> {
  const key = process.env.PAUZO_GEMINI_API_KEY?.trim();
  if (!key) throw new Error("gemini_not_configured");
  const model = process.env.PAUZO_GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: {"Content-Type": "application/json", "x-goog-api-key": key},
    body: JSON.stringify({
      systemInstruction: {parts: [{text: prompt.system}]},
      contents: [{role: "user", parts: [{text: prompt.user}]}],
      // 2.5 models count hidden "thinking" against maxOutputTokens; with a
      // small budget the visible answer came back empty. These answers are
      // short summaries, so thinking is switched off.
      generationConfig: {temperature: 0.4, maxOutputTokens: 1024, thinkingConfig: {thinkingBudget: 0}}
    }),
    cache: "no-store"
  });
  const json = (await res.json()) as {
    candidates?: {content?: {parts?: {text?: string}[]}; finishReason?: string}[];
    error?: {message?: string};
  };
  if (!res.ok) throw new GeminiError(`http_${res.status}`, json.error?.message ?? "");
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
  if (!text) throw new GeminiError("empty", json.candidates?.[0]?.finishReason ?? "no_candidates");
  return text;
}
