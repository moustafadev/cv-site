import {d1Post, getCfD1Config, type CfD1Config} from "@/lib/cv-analytics-d1";

/**
 * Storage for the blog. Production uses Cloudflare D1 over the REST API (same
 * credentials as CV analytics). In `npm run dev` without D1 credentials it falls
 * back to a local SQLite file (data/blog-dev.sqlite) so the exact same SQL runs.
 */

export type Stmt = {sql: string; params?: string[]};
export type Row = Record<string, unknown>;

type Store = {
  kind: "d1" | "dev-sqlite";
  batch(stmts: Stmt[]): Promise<Row[][]>;
};

export class BlogNotConfiguredError extends Error {
  constructor() {
    super("blog_not_configured");
  }
}

const SCHEMA: Stmt[] = [
  {
    sql: `CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      locale TEXT NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      cover_url TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      translation_slug TEXT NOT NULL DEFAULT '',
      source_url TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      reading_minutes INTEGER NOT NULL DEFAULT 1,
      views INTEGER NOT NULL DEFAULT 0,
      published_at INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`
  },
  {sql: `CREATE INDEX IF NOT EXISTS idx_blog_posts_list ON blog_posts(locale, status, published_at)`},
  {
    sql: `CREATE TABLE IF NOT EXISTS blog_likes (
      post_id TEXT NOT NULL,
      visitor TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (post_id, visitor)
    )`
  },
  {
    sql: `CREATE TABLE IF NOT EXISTS blog_comments (
      id TEXT PRIMARY KEY NOT NULL,
      post_id TEXT NOT NULL,
      parent_id TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL,
      body TEXT NOT NULL,
      is_author INTEGER NOT NULL DEFAULT 0,
      visitor TEXT NOT NULL DEFAULT '',
      ip_hash TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL
    )`
  },
  {sql: `CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id, created_at)`},
  {sql: `CREATE INDEX IF NOT EXISTS idx_blog_comments_ip ON blog_comments(ip_hash, created_at)`}
];

function d1Store(cfg: CfD1Config): Store {
  return {
    kind: "d1",
    async batch(stmts) {
      const res = await d1Post(cfg, stmts.length === 1 ? stmts[0]! : {batch: stmts});
      return (res.result ?? []).map((r) => r.results ?? []);
    }
  };
}

type SqliteDb = {
  exec(sql: string): void;
  prepare(sql: string): {all(...params: string[]): Row[]};
};

const devGlobal = globalThis as unknown as {__blogDevDb?: SqliteDb; __blogSchemaReady?: Set<string>};

function openDevDb(): SqliteDb {
  if (devGlobal.__blogDevDb) return devGlobal.__blogDevDb;
  // getBuiltinModule keeps node:sqlite out of the bundler graph; this path only runs in `next dev`.
  const load = (process as unknown as {getBuiltinModule(id: string): unknown}).getBuiltinModule;
  const {DatabaseSync} = load("node:sqlite") as {DatabaseSync: new (file: string) => SqliteDb};
  const fs = load("node:fs") as {mkdirSync(dir: string, opts: {recursive: boolean}): void};
  const dir = `${process.cwd()}/data`;
  fs.mkdirSync(dir, {recursive: true});
  devGlobal.__blogDevDb = new DatabaseSync(`${dir}/blog-dev.sqlite`);
  return devGlobal.__blogDevDb;
}

function devSqliteStore(): Store {
  return {
    kind: "dev-sqlite",
    async batch(stmts) {
      const db = openDevDb();
      db.exec("BEGIN");
      try {
        const out = stmts.map((s) => db.prepare(s.sql).all(...(s.params ?? [])).map((row) => ({...row})));
        db.exec("COMMIT");
        return out;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    }
  };
}

function getStore(): Store | null {
  const cfg = getCfD1Config();
  if (cfg) return d1Store(cfg);
  if (process.env.NODE_ENV === "development") return devSqliteStore();
  return null;
}

export function hasBlogStore(): boolean {
  return getStore() !== null;
}

/** Columns added after the first release; ALTER fails harmlessly once a column exists. */
const MIGRATIONS = [
  `ALTER TABLE blog_posts ADD COLUMN source_url TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE blog_posts ADD COLUMN category TEXT NOT NULL DEFAULT ''`
];

async function ensureSchema(store: Store) {
  const ready = (devGlobal.__blogSchemaReady ??= new Set());
  // Keyed by migration count so a long-running `next dev` re-checks after new migrations are added.
  const key = `${store.kind}:${MIGRATIONS.length}`;
  if (ready.has(key)) return;
  await store.batch(SCHEMA);
  for (const sql of MIGRATIONS) {
    try {
      await store.batch([{sql}]);
    } catch (error) {
      if (!/duplicate column/i.test(error instanceof Error ? error.message : String(error))) throw error;
    }
  }
  ready.add(key);
}

/** Runs statements in order (one D1 round trip) and returns the rows of each. */
export async function blogBatch(stmts: Stmt[]): Promise<Row[][]> {
  const store = getStore();
  if (!store) throw new BlogNotConfiguredError();
  await ensureSchema(store);
  return store.batch(stmts);
}

export async function blogQuery(sql: string, params?: string[]): Promise<Row[]> {
  const [rows] = await blogBatch([{sql, params}]);
  return rows ?? [];
}

export function isUniqueViolation(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /UNIQUE constraint failed/i.test(msg);
}
