import {getCfD1Config, type CfD1Config} from "@/lib/cv-analytics-d1";
import {
  WeddingConfig,
  WeddingRsvp,
  normalizeWeddingConfig,
} from "@/lib/wedding-config";

const CF_API = "https://api.cloudflare.com/client/v4";
const CONFIG_ROW_ID = "default";

type D1QueryResponse = {
  success?: boolean;
  errors?: {message?: string}[];
  result?: Array<{
    success?: boolean;
    results?: Record<string, unknown>[];
  }>;
};

function queryUrl(cfg: CfD1Config): string {
  return `${CF_API}/accounts/${cfg.accountId}/d1/database/${cfg.databaseId}/query`;
}

async function d1Post(
  cfg: CfD1Config,
  body: {sql: string; params?: string[]} | {batch: {sql: string; params?: string[]}[]}
): Promise<D1QueryResponse> {
  const res = await fetch(queryUrl(cfg), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json()) as D1QueryResponse;
  if (!res.ok || json.success === false) {
    const msg = json.errors?.map((e) => e.message).join("; ") || JSON.stringify(json).slice(0, 300);
    throw new Error(`D1 HTTP ${res.status}: ${msg}`);
  }
  return json;
}

let schemaReady = false;

async function ensureWeddingSchema(cfg: CfD1Config) {
  if (schemaReady) return;
  await d1Post(cfg, {
    batch: [
      {
        sql: `CREATE TABLE IF NOT EXISTS wedding_config (
          id TEXT PRIMARY KEY NOT NULL,
          payload TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        )`,
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS wedding_rsvps (
          id TEXT PRIMARY KEY NOT NULL,
          created_at INTEGER NOT NULL,
          name TEXT NOT NULL,
          attending TEXT NOT NULL,
          message TEXT NOT NULL,
          signature TEXT,
          lang TEXT NOT NULL
        )`,
      },
      {
        sql: `CREATE INDEX IF NOT EXISTS idx_wedding_rsvps_created_at ON wedding_rsvps(created_at)`,
      },
    ],
  });
  schemaReady = true;
}

export function hasWeddingD1(): boolean {
  return Boolean(getCfD1Config());
}

export async function d1ReadWeddingConfig(cfg: CfD1Config): Promise<WeddingConfig | null> {
  await ensureWeddingSchema(cfg);
  const res = await d1Post(cfg, {
    sql: `SELECT payload FROM wedding_config WHERE id = ? LIMIT 1`,
    params: [CONFIG_ROW_ID],
  });
  const payload = res.result?.[0]?.results?.[0]?.payload;
  if (typeof payload !== "string" || !payload.trim()) return null;
  try {
    return normalizeWeddingConfig(JSON.parse(payload));
  } catch {
    return null;
  }
}

export async function d1WriteWeddingConfig(cfg: CfD1Config, config: WeddingConfig): Promise<WeddingConfig> {
  const normalized = normalizeWeddingConfig(config);
  await ensureWeddingSchema(cfg);
  await d1Post(cfg, {
    sql: `INSERT INTO wedding_config (id, payload, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
    params: [CONFIG_ROW_ID, JSON.stringify(normalized), String(Date.now())],
  });
  return normalized;
}

export async function d1ReadWeddingRsvps(cfg: CfD1Config): Promise<WeddingRsvp[]> {
  await ensureWeddingSchema(cfg);
  const res = await d1Post(cfg, {
    sql: `SELECT id, created_at, name, attending, message, signature, lang
          FROM wedding_rsvps
          ORDER BY created_at DESC
          LIMIT 500`,
  });
  const rows = res.result?.[0]?.results ?? [];
  return rows
    .map((row): WeddingRsvp | null => {
      const attending = row.attending === "yes" || row.attending === "no" ? row.attending : null;
      if (!attending || typeof row.id !== "string" || typeof row.name !== "string") return null;
      return {
        id: row.id,
        createdAt: Number(row.created_at) || 0,
        name: row.name,
        attending,
        message: typeof row.message === "string" ? row.message : "",
        signature: typeof row.signature === "string" ? row.signature : null,
        lang: row.lang === "ar" ? "ar" : "en",
      };
    })
    .filter((row): row is WeddingRsvp => row !== null);
}

export async function d1AddWeddingRsvp(
  cfg: CfD1Config,
  input: Omit<WeddingRsvp, "id" | "createdAt">
): Promise<WeddingRsvp> {
  await ensureWeddingSchema(cfg);
  const row: WeddingRsvp = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    name: input.name.trim().slice(0, 120),
    attending: input.attending,
    message: input.message.trim().slice(0, 1000),
    signature: input.signature,
    lang: input.lang,
  };
  await d1Post(cfg, {
    sql: `INSERT INTO wedding_rsvps (id, created_at, name, attending, message, signature, lang)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    params: [
      row.id,
      String(row.createdAt),
      row.name,
      row.attending,
      row.message,
      row.signature ?? "",
      row.lang,
    ],
  });
  return row;
}
