import {getSharedStore, type Row, type Stmt, type Store} from "@/lib/blog-db";

/**
 * Tables for the Pauzo mobile app (pairing unlock, trial, purchases, AI
 * usage). They live in the same D1 database as the blog; `next dev` without
 * D1 credentials uses the local SQLite file instead.
 */

export class PauzoNotConfiguredError extends Error {
  constructor() {
    super("pauzo_not_configured");
  }
}

const SCHEMA: (Stmt & {optional?: boolean})[] = [
  {
    sql: `CREATE TABLE IF NOT EXISTS pauzo_devices (
      id TEXT PRIMARY KEY NOT NULL,
      token_hash TEXT NOT NULL,
      platform TEXT NOT NULL DEFAULT '',
      app_version TEXT NOT NULL DEFAULT '',
      locale TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL,
      trial_ends_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'trial',
      unlock_source TEXT NOT NULL DEFAULT '',
      unlocked_at INTEGER NOT NULL DEFAULT 0,
      pair_code TEXT NOT NULL DEFAULT ''
    )`
  },
  {sql: `ALTER TABLE pauzo_devices ADD COLUMN fcm_token TEXT NOT NULL DEFAULT ''`, optional: true},
  {sql: `CREATE INDEX IF NOT EXISTS idx_pauzo_devices_token ON pauzo_devices(token_hash)`},
  {
    sql: `CREATE TABLE IF NOT EXISTS pauzo_pairs (
      code TEXT PRIMARY KEY NOT NULL,
      creator_id TEXT NOT NULL,
      partner_id TEXT NOT NULL DEFAULT '',
      restores INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      joined_at INTEGER NOT NULL DEFAULT 0
    )`
  },
  {
    sql: `CREATE TABLE IF NOT EXISTS pauzo_purchases (
      id TEXT PRIMARY KEY NOT NULL,
      device_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      product_id TEXT NOT NULL,
      transaction_id TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )`
  },
  {sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_pauzo_purchases_tx ON pauzo_purchases(platform, transaction_id)`},
  {sql: `ALTER TABLE pauzo_purchases ADD COLUMN restores INTEGER NOT NULL DEFAULT 0`, optional: true},
  {sql: `ALTER TABLE pauzo_purchases ADD COLUMN restored_at INTEGER NOT NULL DEFAULT 0`, optional: true},
  // Before restores demoted the old install, a reinstall left two devices
  // marked paid for one purchase; only the purchase's current owner stays paid.
  {
    sql: `UPDATE pauzo_devices SET status = 'trial', unlock_source = 'moved',
            trial_ends_at = MIN(trial_ends_at, unlocked_at)
          WHERE status = 'paid' AND id NOT IN (SELECT device_id FROM pauzo_purchases)`
  },
  // Shared budget: members see each other's operations (premium).
  {
    sql: `CREATE TABLE IF NOT EXISTS pauzo_households (
      code TEXT PRIMARY KEY NOT NULL,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`
  },
  {
    sql: `CREATE TABLE IF NOT EXISTS pauzo_household_members (
      device_id TEXT PRIMARY KEY NOT NULL,
      household_code TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      joined_at INTEGER NOT NULL
    )`
  },
  {sql: `CREATE INDEX IF NOT EXISTS idx_pauzo_members_household ON pauzo_household_members(household_code)`},
  {
    sql: `CREATE TABLE IF NOT EXISTS pauzo_shared_ops (
      device_id TEXT NOT NULL,
      op_id TEXT NOT NULL,
      household_code TEXT NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      category TEXT NOT NULL,
      day TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      recurring INTEGER NOT NULL DEFAULT 0,
      recurring_enabled INTEGER NOT NULL DEFAULT 1,
      deleted INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (device_id, op_id)
    )`
  },
  {sql: `CREATE INDEX IF NOT EXISTS idx_pauzo_shared_ops_sync ON pauzo_shared_ops(household_code, updated_at)`},
  {
    sql: `CREATE TABLE IF NOT EXISTS pauzo_counters (
      key TEXT NOT NULL,
      day TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (key, day)
    )`
  }
];

const schemaGlobal = globalThis as unknown as {__pauzoSchemaReady?: Set<string>};

async function ensureSchema(store: Store) {
  const ready = (schemaGlobal.__pauzoSchemaReady ??= new Set());
  if (ready.has(store.kind)) return;
  for (const stmt of SCHEMA) {
    try {
      await store.batch([{sql: stmt.sql}]);
    } catch (error) {
      // Columns added after the first release: ALTER fails once they exist.
      const duplicate = /duplicate column/i.test(error instanceof Error ? error.message : String(error));
      if (!(stmt.optional && duplicate)) throw error;
    }
  }
  ready.add(store.kind);
}

/** Runs statements in order inside one transaction and returns the rows of each. */
export async function pauzoBatch(stmts: Stmt[]): Promise<Row[][]> {
  const store = getSharedStore();
  if (!store) throw new PauzoNotConfiguredError();
  await ensureSchema(store);
  return store.batch(stmts);
}

export async function pauzoQuery(sql: string, params?: (string | number)[]): Promise<Row[]> {
  const [rows] = await pauzoBatch([{sql, params}]);
  return rows ?? [];
}

export function isPauzoConfigured(): boolean {
  return getSharedStore() !== null;
}

/**
 * Atomic daily counter: returns the new count so the caller can compare it
 * with its limit. One statement, so two concurrent requests can't both pass.
 */
export async function bumpDailyCounter(key: string, day: string): Promise<number> {
  const [, rows] = await pauzoBatch([
    {
      sql: `INSERT INTO pauzo_counters (key, day, count) VALUES (?, ?, 1)
        ON CONFLICT(key, day) DO UPDATE SET count = count + 1`,
      params: [key, day]
    },
    {sql: `SELECT count FROM pauzo_counters WHERE key = ? AND day = ?`, params: [key, day]}
  ]);
  return Number(rows?.[0]?.count ?? 0);
}
