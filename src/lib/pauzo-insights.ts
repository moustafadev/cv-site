import {getCloudflareContext} from "@opennextjs/cloudflare";
import {pauzoQuery} from "@/lib/pauzo-db";

/**
 * The money coach: fixed questions (everyone) and a free chat (premium).
 * The app sends the month in numbers — plan, totals, goal, wish, limits,
 * the last months' totals and, for the chat, the operations themselves
 * (date, type, category, amount; never comments). Nothing is stored here.
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
  /** Totals of the last few months, oldest first. */
  history?: {month: string; income: number; expenses: number}[];
  /** This month's and recent operations, newest first (chat only). */
  operations?: {date: string; type: "income" | "expense"; category: string; amount: number; recurring: boolean}[];
};

export type CoachData = Omit<InsightInput, "question">;

export type ChatMessage = {role: "user" | "model"; text: string};

const LANGUAGE_NAMES: Record<string, string> = {
  "ar-EG": "Egyptian Arabic (colloquial, as spoken in Cairo)",
  ar: "Modern Standard Arabic",
  en: "English",
  "en-GB": "British English",
  de: "German (informal du)",
  fr: "French (informal tu)",
  es: "Spanish (informal tú)",
  it: "Italian (informal tu)",
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

function languageOf(locale: string): string {
  return LANGUAGE_NAMES[locale] ?? LANGUAGE_NAMES[locale.split("-")[0]!] ?? "English";
}

/** The month as plain lines the model reads; shared by questions and chat. */
function dataLines(input: CoachData, withOperations: boolean): string[] {
  const c = input.currency;
  const free = input.plan.income - input.plan.mandatory - input.plan.daily - input.plan.reserve;
  const lines = [
    `Today's month: ${input.month}`,
    `Plan: income ${money(input.plan.income, c)}, fixed expenses ${money(input.plan.mandatory, c)}, everyday spending ${money(input.plan.daily, c)}, set aside ${money(input.plan.reserve, c)}, free for goals and wishes ${money(free, c)}`,
    `Actual so far this month: income ${money(input.actual.income, c)}, expenses ${money(input.actual.expenses, c)}`,
    `Expenses by category this month: ${
      Object.entries(input.actual.byCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `${k} ${money(v, c)}`)
        .join(", ") || "none yet"
    }`
  ];
  if (input.previous) {
    lines.push(`Previous month: income ${money(input.previous.income, c)}, expenses ${money(input.previous.expenses, c)}`);
  }
  if (input.history?.length) {
    lines.push(
      `Recent months: ${input.history.map((h) => `${h.month} income ${money(h.income, c)} / expenses ${money(h.expenses, c)}`).join("; ")}`
    );
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
      `Category limits this month: ${Object.entries(input.limits)
        .map(([k, v]) => `${k} ${money(v.spent, c)} of ${money(v.limit, c)}`)
        .join(", ")}`
    );
  }
  if (withOperations && input.operations?.length) {
    lines.push(
      "Operations (newest first; date, type, category, amount):",
      ...input.operations.map(
        (o) => `${o.date} ${o.type} ${o.category} ${money(o.amount, c)}${o.recurring ? " (monthly)" : ""}`
      )
    );
  }
  return lines;
}

function rules(input: CoachData, maxWords: number): string {
  return [
    "You are the money coach inside Pauzo, a personal budgeting app.",
    `Write in ${languageOf(input.locale)}. Keep it under ${maxWords} words, friendly and direct, plain text with short paragraphs or a short list; no markdown headings, no emojis.`,
    "Use only the numbers given. Never invent transactions, never give investment, loan or tax advice.",
    `Amounts are in ${input.currency}; write them with digits.`
  ].join(" ");
}

export function buildPrompt(input: InsightInput): {system: string; user: string} {
  return {
    system: rules(input, 120),
    user: `${QUESTION_TASKS[input.question]}\n\nData:\n${dataLines(input, false).join("\n")}`
  };
}

/**
 * Premium chat: the data goes in the system instruction so every turn sees
 * it; the conversation is the app's recent messages.
 */
export function buildChat(input: CoachData, messages: ChatMessage[]): {system: string; contents: GeminiContent[]} {
  const system = [
    rules(input, 160),
    "Answer only questions about the user's money, budget, goals and spending in this app; for anything else, say briefly that you can only help with their money.",
    "If the data can't answer a question, say what is missing instead of guessing.",
    `The user's data:\n${dataLines(input, true).join("\n")}`
  ].join("\n\n");
  return {system, contents: messages.map((m) => ({role: m.role, parts: [{text: m.text}]}))};
}

export class GeminiError extends Error {
  constructor(
    public readonly kind: string,
    detail: string
  ) {
    super(`gemini_${kind}: ${detail}`);
  }
}

const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta";

/** Google's free tier: requests a day per model. */
export const GEMINI_FREE_REQUESTS_PER_MODEL = 20;
/** The newest Flash plus the two it falls back to. */
export const GEMINI_MODELS_TRIED = 3;

/** Google's daily quota resets at midnight Pacific time, not UTC. */
export function geminiQuotaDay(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {timeZone: "America/Los_Angeles"}).format(now);
}

/** Every call counts against Google's quota, failed ones included. */
function countGeminiRequest(model: string): Promise<void> {
  return countAiRequest(`gemini:${model}`);
}

async function countAiRequest(key: string): Promise<void> {
  try {
    await pauzoQuery(
      `INSERT INTO pauzo_counters (key, day, count) VALUES (?, ?, 1)
        ON CONFLICT(key, day) DO UPDATE SET count = count + 1`,
      [key, geminiQuotaDay()]
    );
  } catch {
    // Only the admin page reads it; an answer never fails over the count.
  }
}

type ModelInfo = {name?: string; supportedGenerationMethods?: string[]};

const modelCache = globalThis as unknown as {__pauzoGeminiModels?: string[]};

function flashVersion(id: string): number | null {
  const m = /^gemini-(\d+(?:\.\d+)?)-flash$/.exec(id);
  return m ? Number(m[1]) : null;
}

/**
 * Google retires Flash versions often (2.5 started returning 404 for new
 * keys), so unless PAUZO_GEMINI_MODEL pins one, the stable `gemini-X-flash`
 * models this key can call are looked up, newest first, and kept per isolate.
 */
async function resolveModels(key: string, refresh = false): Promise<string[]> {
  const pinned = process.env.PAUZO_GEMINI_MODEL?.trim();
  if (pinned) return [pinned];
  if (modelCache.__pauzoGeminiModels && !refresh) return modelCache.__pauzoGeminiModels;
  const res = await fetch(`${GEMINI_API}/models?pageSize=200`, {headers: {"x-goog-api-key": key}, cache: "no-store"});
  const json = (await res.json()) as {models?: ModelInfo[]; error?: {message?: string}};
  if (!res.ok) throw new GeminiError(`models_${res.status}`, json.error?.message ?? "");
  const models = (json.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
    .map((m) => String(m.name ?? "").replace(/^models\//, ""))
    .map((id) => ({id, version: flashVersion(id)}))
    .filter((m): m is {id: string; version: number} => m.version !== null)
    .sort((a, b) => b.version - a.version)
    .map((m) => m.id);
  if (!models.length) throw new GeminiError("no_model", "no gemini-X-flash model available for this key");
  modelCache.__pauzoGeminiModels = models;
  return models;
}

/** Overloaded or rate limited: worth asking an older Flash instead. */
function isBusy(status: number): boolean {
  return status === 429 || status === 500 || status === 503;
}

function thinkingConfig(model: string): Record<string, unknown> {
  // 2.x spends maxOutputTokens on hidden thinking unless the budget is 0;
  // 3.x takes a level instead. These answers are short, so keep it minimal.
  return (flashVersion(model) ?? 3) < 3 ? {thinkingBudget: 0} : {thinkingLevel: "low"};
}

export type GeminiPart = {text: string} | {inline_data: {mime_type: string; data: string}};
export type GeminiContent = {role: "user" | "model"; parts: GeminiPart[]};

/** `json` asks for a JSON object back (parsing a sentence or a receipt). */
export type GeminiOptions = {json?: boolean; temperature?: number; maxOutputTokens?: number};

async function generate(
  key: string,
  model: string,
  prompt: {system: string; contents: GeminiContent[]},
  options: GeminiOptions
) {
  return fetch(`${GEMINI_API}/models/${model}:generateContent`, {
    method: "POST",
    headers: {"Content-Type": "application/json", "x-goog-api-key": key},
    body: JSON.stringify({
      systemInstruction: {parts: [{text: prompt.system}]},
      contents: prompt.contents,
      // Headroom: thinking tokens count against this limit too, and a
      // cut-off answer was worse than a slightly slower one.
      generationConfig: {
        temperature: options.temperature ?? 0.4,
        maxOutputTokens: options.maxOutputTokens ?? 4096,
        thinkingConfig: thinkingConfig(model),
        ...(options.json ? {responseMimeType: "application/json"} : {})
      }
    }),
    cache: "no-store"
  });
}

/**
 * Cloudflare Workers AI runs next to this Worker and has a free daily
 * allowance, so it answers first; Gemini is the fallback. GPT-OSS gave the
 * best Egyptian Arabic of the models tried, usually in 2–7 s.
 */
const WORKERS_AI_MODEL = "@cf/openai/gpt-oss-120b";
// It sometimes queues for over a minute; the app gives up at 40 s, so
// leave room for Gemini after it.
const WORKERS_AI_TIMEOUT_MS = 15_000;

type WorkersAi = {run: (model: string, input: Record<string, unknown>) => Promise<unknown>};

function workersAi(): WorkersAi | null {
  try {
    return (getCloudflareContext().env as {AI?: WorkersAi}).AI ?? null;
  } catch {
    // `next dev` without the Cloudflare runtime.
    return null;
  }
}

/**
 * The app shows answers as plain text, but models still write Markdown now
 * and then: drop bold and headings, and turn list dashes into bullets.
 */
export function plainText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^(\s*)[-*]\s+/gm, "$1• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Text only (it can't read receipts); null hands the request to Gemini. */
async function askWorkersAi(
  request: {system: string; contents: GeminiContent[]},
  options: GeminiOptions
): Promise<string | null> {
  const ai = workersAi();
  const textOnly = request.contents.every((c) => c.parts.every((p) => "text" in p));
  if (!ai || !textOnly) return null;
  const input = request.contents.map((c) => ({
    role: c.role === "model" ? "assistant" : "user",
    content: c.parts.map((p) => ("text" in p ? p.text : "")).join("\n")
  }));
  const instructions = options.json
    ? `${request.system}\n\nReply with one JSON object only, no other text.`
    : request.system;
  try {
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), WORKERS_AI_TIMEOUT_MS));
    const run = ai.run(WORKERS_AI_MODEL, {
      instructions,
      input,
      // Its reasoning counts against this too.
      max_output_tokens: Math.max(options.maxOutputTokens ?? 1500, 800),
      reasoning: {effort: "low"},
      temperature: options.temperature ?? 0.4
    });
    void countAiRequest(`wai:${WORKERS_AI_MODEL.split("/").pop()}`);
    const result = (await Promise.race([run, timeout])) as {
      response?: string;
      output?: {content?: {type?: string; text?: string}[]}[];
    } | null;
    if (!result) return null;
    const text = (
      result.response ??
      (result.output ?? [])
        .flatMap((o) => o.content ?? [])
        .filter((c) => c.type === "output_text" || c.type === "text")
        .map((c) => c.text ?? "")
        .join("")
    ).trim();
    if (!text) return null;
    if (options.json) {
      // Only a reply that really is JSON counts; anything else goes to Gemini.
      const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
      try {
        JSON.parse(json);
        return json;
      } catch {
        return null;
      }
    }
    return text;
  } catch (error) {
    console.error("[pauzo:workers-ai]", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function askGemini(
  prompt: {system: string; user: string} | {system: string; contents: GeminiContent[]},
  options: GeminiOptions = {}
): Promise<string> {
  const request =
    "contents" in prompt ? prompt : {system: prompt.system, contents: [{role: "user" as const, parts: [{text: prompt.user}]}]};
  const viaWorkers = await askWorkersAi(request, options);
  if (viaWorkers) return options.json ? viaWorkers : plainText(viaWorkers);
  const key = process.env.PAUZO_GEMINI_API_KEY?.trim();
  if (!key) throw new Error("gemini_not_configured");
  const send = async (m: string) => (await Promise.all([generate(key, m, request, options), countGeminiRequest(m)]))[0];
  let models = await resolveModels(key);
  let model = models[0];
  let res = await send(model);
  // The cached model was retired since the isolate started: look again once.
  if (res.status === 404 && !process.env.PAUZO_GEMINI_MODEL?.trim()) {
    models = await resolveModels(key, true);
    model = models[0];
    res = await send(model);
  }
  // The newest Flash is often the busiest (503): fall back down the list.
  for (const fallback of models.slice(1, GEMINI_MODELS_TRIED)) {
    if (!isBusy(res.status)) break;
    model = fallback;
    res = await send(model);
  }
  const json = (await res.json()) as {
    candidates?: {content?: {parts?: {text?: string; thought?: boolean}[]}; finishReason?: string}[];
    error?: {message?: string};
  };
  if (!res.ok) throw new GeminiError(`http_${res.status}`, `${model}: ${json.error?.message ?? ""}`);
  const text = json.candidates?.[0]?.content?.parts
    ?.filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) throw new GeminiError("empty", `${model}: ${json.candidates?.[0]?.finishReason ?? "no_candidates"}`);
  return options.json ? text : plainText(text);
}
