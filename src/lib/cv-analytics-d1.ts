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

function isMissingColumnError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message.toLowerCase() : "";
  return msg.includes("no such column");
}

const SCHEMA_BATCH = [
  {
    sql: `CREATE TABLE IF NOT EXISTS cv_views (
      id TEXT PRIMARY KEY NOT NULL,
      created_at INTEGER NOT NULL,
      path TEXT NOT NULL,
      locale TEXT,
      ref_host TEXT NOT NULL,
      source TEXT,
      platform TEXT,
      country TEXT,
      referrer TEXT,
      user_agent TEXT
    )`
  },
  {
    sql: `CREATE INDEX IF NOT EXISTS idx_cv_views_created_at ON cv_views(created_at)`
  },
  {
    sql: `CREATE INDEX IF NOT EXISTS idx_cv_views_ref_host ON cv_views(ref_host)`
  },
  {
    sql: `CREATE INDEX IF NOT EXISTS idx_cv_views_source ON cv_views(source)`
  },
  {
    sql: `CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY NOT NULL,
      created_at INTEGER NOT NULL,
      locale TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL
    )`
  },
  {
    sql: `CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at)`
  }
];

export async function d1EnsureSchema(cfg: CfD1Config): Promise<void> {
  if (d1SchemaReady) return;
  await d1Post(cfg, {batch: SCHEMA_BATCH});
  // Lightweight migrations for existing databases created before extra columns were added.
  const migrations = [
    `ALTER TABLE cv_views ADD COLUMN source TEXT`,
    `ALTER TABLE cv_views ADD COLUMN platform TEXT`,
    `ALTER TABLE cv_views ADD COLUMN country TEXT`
  ];
  for (const sql of migrations) {
    try {
      await d1Post(cfg, {sql});
    } catch (error) {
      const msg = error instanceof Error ? error.message.toLowerCase() : "";
      if (!msg.includes("duplicate column")) throw error;
    }
  }
  d1SchemaReady = true;
}

export async function d1RecordView(
  cfg: CfD1Config,
  row: {
    id: string;
    t: number;
    path: string;
    locale: string;
    referrer: string;
    refHost: string;
    source: string;
    platform: string;
    country: string;
    ua: string;
  }
): Promise<void> {
  await d1EnsureSchema(cfg);
  try {
    await d1Post(cfg, {
      sql: `INSERT INTO cv_views (id, created_at, path, locale, ref_host, source, platform, country, referrer, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        row.id,
        String(row.t),
        row.path,
        row.locale,
        row.refHost,
        row.source,
        row.platform,
        row.country,
        row.referrer,
        row.ua
      ]
    });
  } catch (error) {
    if (!isMissingColumnError(error)) throw error;
    d1SchemaReady = false;
    await d1EnsureSchema(cfg);
    await d1Post(cfg, {
      sql: `INSERT INTO cv_views (id, created_at, path, locale, ref_host, source, platform, country, referrer, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        row.id,
        String(row.t),
        row.path,
        row.locale,
        row.refHost,
        row.source,
        row.platform,
        row.country,
        row.referrer,
        row.ua
      ]
    });
  }
}

export async function d1GetStats(cfg: CfD1Config): Promise<{
  totalViews: number;
  bySource: {source: string; count: number}[];
  recent: {
    t: number;
    path: string;
    locale: string;
    referrer: string;
    refHost: string;
    source: string;
    platform: string;
    country: string;
    ua: string;
  }[];
}> {
  await d1EnsureSchema(cfg);
  let batch: D1QueryResponse;
  try {
    batch = await d1Post(cfg, {
      batch: [
        {sql: "SELECT COUNT(*) AS c FROM cv_views"},
        {
          sql: `SELECT COALESCE(NULLIF(source, ''), ref_host, '(direct / no referrer)') AS source, COUNT(*) AS cnt FROM cv_views GROUP BY source ORDER BY cnt DESC LIMIT 100`
        },
        {
          sql: `SELECT created_at AS t, path, locale, ref_host AS refHost, source, platform, country, referrer, user_agent AS ua FROM cv_views ORDER BY created_at DESC LIMIT 100`
        }
      ]
    });
  } catch (error) {
    if (!isMissingColumnError(error)) throw error;
    d1SchemaReady = false;
    await d1EnsureSchema(cfg);
    batch = await d1Post(cfg, {
      batch: [
        {sql: "SELECT COUNT(*) AS c FROM cv_views"},
        {
          sql: `SELECT COALESCE(NULLIF(source, ''), ref_host, '(direct / no referrer)') AS source, COUNT(*) AS cnt FROM cv_views GROUP BY source ORDER BY cnt DESC LIMIT 100`
        },
        {
          sql: `SELECT created_at AS t, path, locale, ref_host AS refHost, source, platform, country, referrer, user_agent AS ua FROM cv_views ORDER BY created_at DESC LIMIT 100`
        }
      ]
    });
  }

  const parts = batch.result ?? [];
  const totalRow = parts[0]?.results?.[0] ?? {};
  const cVal = totalRow.c ?? totalRow.COUNT;
  const totalViews = typeof cVal === "number" ? cVal : Number(cVal ?? 0);

  const sourceRows = parts[1]?.results ?? [];
  const bySource = sourceRows
    .map((r) => ({
      source: String(r.source ?? ""),
      count: Number(r.cnt ?? r.count ?? 0) || 0
    }))
    .filter((x) => x.source);

  const recentRows = parts[2]?.results ?? [];
  const recent = recentRows.map((r) => ({
    t: Number(r.t ?? 0) || 0,
    path: String(r.path ?? ""),
    locale: String(r.locale ?? ""),
    refHost: String(r.refHost ?? r.ref_host ?? ""),
    source: String(r.source ?? r.refHost ?? r.ref_host ?? ""),
    platform: String(r.platform ?? ""),
    country: String(r.country ?? ""),
    referrer: String(r.referrer ?? ""),
    ua: String(r.ua ?? r.user_agent ?? "")
  }));

  return {totalViews, bySource, recent};
}

export async function d1RecordContactMessage(
  cfg: CfD1Config,
  row: {
    id: string;
    t: number;
    locale: string;
    name: string;
    email: string;
    message: string;
  }
): Promise<void> {
  await d1EnsureSchema(cfg);
  await d1Post(cfg, {
    sql: `INSERT INTO contact_messages (id, created_at, locale, name, email, message) VALUES (?, ?, ?, ?, ?, ?)`,
    params: [row.id, String(row.t), row.locale, row.name, row.email, row.message]
  });
}

export async function d1GetContactMessages(cfg: CfD1Config): Promise<
  {
    id: string;
    t: number;
    locale: string;
    name: string;
    email: string;
    message: string;
  }[]
> {
  await d1EnsureSchema(cfg);
  const result = await d1Post(cfg, {
    sql: `SELECT id, created_at AS t, locale, name, email, message FROM contact_messages ORDER BY created_at DESC LIMIT 100`
  });
  const rows = result.result?.[0]?.results ?? [];
  return rows.map((row) => ({
    id: String(row.id ?? ""),
    t: Number(row.t ?? 0) || 0,
    locale: String(row.locale ?? ""),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    message: String(row.message ?? "")
  }));
}
