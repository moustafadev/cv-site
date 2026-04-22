const CF_API = "https://api.cloudflare.com/client/v4";

export type CfD1Config = {
  accountId: string;
  databaseId: string;
  token: string;
};

export function getCfD1Config(): CfD1Config | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID?.trim();
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!accountId || !databaseId || !token) return null;
  return {accountId, databaseId, token};
}

type D1QueryResponse = {
  success?: boolean;
  errors?: {message?: string}[];
  result?: Array<{
    success?: boolean;
    results?: Record<string, unknown>[];
    meta?: unknown;
  }>;
};

function queryUrl(cfg: CfD1Config): string {
  return `${CF_API}/accounts/${cfg.accountId}/d1/database/${cfg.databaseId}/query`;
}

async function d1Post(cfg: CfD1Config, body: {sql: string; params?: string[]} | {batch: {sql: string; params?: string[]}[]}): Promise<D1QueryResponse> {
  const res = await fetch(queryUrl(cfg), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });
  const json = (await res.json()) as D1QueryResponse;
  if (!res.ok || json.success === false) {
    const msg = json.errors?.map((e) => e.message).join("; ") || JSON.stringify(json).slice(0, 300);
    throw new Error(`D1 HTTP ${res.status}: ${msg}`);
  }
  return json;
}

let d1SchemaReady = false;

const SCHEMA_BATCH = [
  {
    sql: `CREATE TABLE IF NOT EXISTS cv_views (
      id TEXT PRIMARY KEY NOT NULL,
      created_at INTEGER NOT NULL,
      path TEXT NOT NULL,
      locale TEXT,
      ref_host TEXT NOT NULL,
      referrer TEXT,
      user_agent TEXT
    )`
  },
  {
    sql: `CREATE INDEX IF NOT EXISTS idx_cv_views_created_at ON cv_views(created_at)`
  },
  {
    sql: `CREATE INDEX IF NOT EXISTS idx_cv_views_ref_host ON cv_views(ref_host)`
  }
];

export async function d1EnsureSchema(cfg: CfD1Config): Promise<void> {
  if (d1SchemaReady) return;
  await d1Post(cfg, {batch: SCHEMA_BATCH});
  d1SchemaReady = true;
}

export async function d1RecordView(
  cfg: CfD1Config,
  row: {id: string; t: number; path: string; locale: string; referrer: string; refHost: string; ua: string}
): Promise<void> {
  await d1EnsureSchema(cfg);
  await d1Post(cfg, {
    sql: `INSERT INTO cv_views (id, created_at, path, locale, ref_host, referrer, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    params: [
      row.id,
      String(row.t),
      row.path,
      row.locale,
      row.refHost,
      row.referrer,
      row.ua
    ]
  });
}

export async function d1GetStats(cfg: CfD1Config): Promise<{
  totalViews: number;
  byRefHost: {host: string; count: number}[];
  recent: {
    t: number;
    path: string;
    locale: string;
    referrer: string;
    refHost: string;
    ua: string;
  }[];
}> {
  await d1EnsureSchema(cfg);
  const batch = await d1Post(cfg, {
    batch: [
      {sql: "SELECT COUNT(*) AS c FROM cv_views"},
      {
        sql: `SELECT ref_host AS host, COUNT(*) AS cnt FROM cv_views GROUP BY ref_host ORDER BY cnt DESC LIMIT 100`
      },
      {
        sql: `SELECT created_at AS t, path, locale, ref_host AS refHost, referrer, user_agent AS ua FROM cv_views ORDER BY created_at DESC LIMIT 100`
      }
    ]
  });

  const parts = batch.result ?? [];
  const totalRow = parts[0]?.results?.[0] ?? {};
  const cVal = totalRow.c ?? totalRow.COUNT;
  const totalViews = typeof cVal === "number" ? cVal : Number(cVal ?? 0);

  const refRows = parts[1]?.results ?? [];
  const byRefHost = refRows
    .map((r) => ({
      host: String(r.host ?? ""),
      count: Number(r.cnt ?? r.count ?? 0) || 0
    }))
    .filter((x) => x.host);

  const recentRows = parts[2]?.results ?? [];
  const recent = recentRows.map((r) => ({
    t: Number(r.t ?? 0) || 0,
    path: String(r.path ?? ""),
    locale: String(r.locale ?? ""),
    refHost: String(r.refHost ?? r.ref_host ?? ""),
    referrer: String(r.referrer ?? ""),
    ua: String(r.ua ?? r.user_agent ?? "")
  }));

  return {totalViews, byRefHost, recent};
}
