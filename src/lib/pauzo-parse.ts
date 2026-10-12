import {askGemini, type GeminiPart} from "@/lib/pauzo-insights";

/** Categories the app knows; anything else from the model becomes "other". */
export const PARSE_CATEGORIES = ["shopping", "travel", "education", "home", "health", "subscriptions", "other"] as const;
export type ParseCategory = (typeof PARSE_CATEGORIES)[number];

export type ParsedOperation = {
  type: "income" | "expense";
  amount: number;
  category: ParseCategory;
  /** yyyy-MM-dd, or null for today. */
  date: string | null;
  note: string;
};

export type ParseInput = {
  text?: string;
  image?: {mimeType: string; base64: string};
  locale: string;
  today: string;
};

const SYSTEM = `You read one money movement written by a user of a personal budgeting app used in Europe, the US and the Middle East (any language: a spoken sentence, a pasted bank, card or wallet notification, or a photo of a receipt) and return it as JSON.
Return exactly: {"type":"income"|"expense","amount":number,"category":string,"date":"yyyy-MM-dd"|null,"note":string}
- amount: the money that moved, a positive number in the message's currency, rounded to whole units. Never a balance, available credit, card number, phone number or reference id. For a receipt, the grand total. Read European 1.234,56 and US 1,234.56 correctly.
- category (expenses only, use "other" for income): shopping = groceries, supermarket (Walmart, Target, Tesco, Lidl, Aldi, Carrefour...), food delivery, clothes, everyday buying; travel = transport, Uber, Lyft, fuel, parking, trips, restaurants, cafes, outings; education = courses, school, tuition, books; home = rent, mortgage, utilities, internet, phone bills, insurance, home repairs; health = doctor, pharmacy, medicine; subscriptions = streaming (Netflix, Hulu, Max, Disney+, Spotify...), AI and software (ChatGPT, Claude, Microsoft 365, Adobe...), cloud storage, gym memberships, Uber One, DashPass, Patreon and any other recurring membership; other = anything else.
- date: only if the message names a date or says yesterday etc.; otherwise null. Today is given.
- note: 1-4 words naming the merchant or what it was, in the user's language. No amounts.
If there is no money amount at all, return {"amount":0}.`;

function clean(value: unknown): ParsedOperation | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const amount = Math.round(Number(v.amount));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) return null;
  const type = v.type === "income" ? "income" : "expense";
  const category = PARSE_CATEGORIES.includes(v.category as ParseCategory) ? (v.category as ParseCategory) : "other";
  const date = typeof v.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.date) ? v.date : null;
  const note = typeof v.note === "string" ? v.note.trim().slice(0, 40) : "";
  return {type, amount, category: type === "income" ? "other" : category, date, note};
}

export async function parseOperation(input: ParseInput): Promise<ParsedOperation | null> {
  const parts: GeminiPart[] = [{text: `Today: ${input.today}. Language: ${input.locale}.`}];
  if (input.text) parts.push({text: `Message:\n${input.text}`});
  if (input.image) parts.push({inline_data: {mime_type: input.image.mimeType, data: input.image.base64}});
  const raw = await askGemini(
    {system: SYSTEM, contents: [{role: "user", parts}]},
    {json: true, temperature: 0, maxOutputTokens: 512}
  );
  try {
    return clean(JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, "")));
  } catch {
    return null;
  }
}
