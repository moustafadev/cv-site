import {getCfD1Config} from "@/lib/cv-analytics-d1";
import {pauzoBatch} from "@/lib/pauzo-db";

/**
 * How full the D1 database is and how hard it's worked, for /admin/pauzo.
 * Size and usage come from Cloudflare's API (the whole database: the site's
 * tables too); row counts are Pauzo's own tables.
 */

const CF_API = "https://api.cloudflare.com/client/v4";
const DAY_MS = 24 * 60 * 60 * 1000;

/** Cloudflare's free plan; the paid plan allows 10 GB and far more rows. */
export const D1_FREE_LIMITS = {
  sizeBytes: 500 * 1024 * 1024,
  rowsReadPerDay: 5_000_000,
  rowsWrittenPerDay: 100_000
};

/** Counter rows are only read for today, so older ones are dead weight. */
const COUNTER_KEEP_DAYS = 2;

export type DatabaseStats = {
  sizeBytes: number | null;
  tables: number | null;
  // Null when the API token can't read account analytics.
  rowsRead24h: number | null;
  rowsWritten24h: number | null;
  rows: {devices: number; pairs: number; purchases: number; counters: number; oldCounters: number};
  limits: typeof D1_FREE_LIMITS;
};

export async function getDatabaseStats(): Promise<DatabaseStats> {
  const cfg = getCfD1Config();
  const [info, usage, rows] = await Promise.all([
    cfg ? databaseInfo(cfg.accountId, cfg.databaseId, cfg.token) : null,
    cfg ? usageLast24h(cfg.accountId, cfg.databaseId, cfg.token) : null,
    rowCounts()
  ]);
  return {
    sizeBytes: info?.sizeBytes ?? null,
    tables: info?.tables ?? null,
    rowsRead24h: usage?.rowsRead ?? null,
    rowsWritten24h: usage?.rowsWritten ?? null,
    rows,
    limits: D1_FREE_LIMITS
  };
}

async function databaseInfo(accountId: string, databaseId: string, token: string) {
  try {
    const res = await fetch(`${CF_API}/accounts/${accountId}/d1/database/${databaseId}`, {
      headers: {Authorization: `Bearer ${token}`},
      cache: "no-store"
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {result?: {file_size?: number; num_tables?: number}};
    return {sizeBytes: Number(json.result?.file_size ?? 0), tables: Number(json.result?.num_tables ?? 0)};
  } catch {
    return null;
  }
}

async function usageLast24h(accountId: string, databaseId: string, token: string) {
  const until = new Date();
  const since = new Date(until.getTime() - DAY_MS);
  const query = `query ($account: String!, $db: String!, $since: Time!, $until: Time!) {
    viewer { accounts(filter: {accountTag: $account}) {
      d1AnalyticsAdaptiveGroups(limit: 10000, filter: {databaseId: $db, datetimeHour_geq: $since, datetimeHour_leq: $until}) {
        sum { rowsRead rowsWritten }
      }
    } }
  }`;
  try {
    const res = await fetch(`${CF_API}/graphql`, {
      method: "POST",
      headers: {Authorization: `Bearer ${token}`, "Content-Type": "application/json"},
      body: JSON.stringify({
        query,
        variables: {account: accountId, db: databaseId, since: since.toISOString(), until: until.toISOString()}
      }),
      cache: "no-store"
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: {viewer?: {accounts?: {d1AnalyticsAdaptiveGroups?: {sum?: {rowsRead?: number; rowsWritten?: number}}[]}[]}};
      errors?: unknown[];
    };
    const groups = json.data?.viewer?.accounts?.[0]?.d1AnalyticsAdaptiveGroups;
    if (json.errors?.length || !groups) return null;
    return {
      rowsRead: groups.reduce((n, g) => n + Number(g.sum?.rowsRead ?? 0), 0),
      rowsWritten: groups.reduce((n, g) => n + Number(g.sum?.rowsWritten ?? 0), 0)
    };
  } catch {
    return null;
  }
}

async function rowCounts(): Promise<DatabaseStats["rows"]> {
  const keepFrom = new Date(Date.now() - COUNTER_KEEP_DAYS * DAY_MS).toISOString().slice(0, 10);
  const [devices, pairs, purchases, counters] = await pauzoBatch([
    {sql: `SELECT COUNT(*) AS n FROM pauzo_devices`},
    {sql: `SELECT COUNT(*) AS n FROM pauzo_pairs`},
    {sql: `SELECT COUNT(*) AS n FROM pauzo_purchases`},
    {
      sql: `SELECT COUNT(*) AS n, SUM(CASE WHEN day < ? THEN 1 ELSE 0 END) AS old FROM pauzo_counters`,
      params: [keepFrom]
    }
  ]);
  return {
    devices: Number(devices?.[0]?.n ?? 0),
    pairs: Number(pairs?.[0]?.n ?? 0),
    purchases: Number(purchases?.[0]?.n ?? 0),
    counters: Number(counters?.[0]?.n ?? 0),
    oldCounters: Number(counters?.[0]?.old ?? 0)
  };
}
