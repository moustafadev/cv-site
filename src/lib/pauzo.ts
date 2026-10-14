import {bumpDailyCounter, pauzoBatch, pauzoQuery} from "@/lib/pauzo-db";
import {GEMINI_FREE_REQUESTS_PER_MODEL, GEMINI_MODELS_TRIED, geminiQuotaDay} from "@/lib/pauzo-insights";
import {sendPartnerJoinedPush} from "@/lib/pauzo-push";
import type {Row} from "@/lib/blog-db";

/**
 * Pauzo plans: every install is free and keeps every budgeting feature,
 * the AI questions included. Premium — a verified one-time purchase, or both
 * phones of a completed invite code — opens the AI chat. Nothing ever locks
 * the app.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
/** Extra installs the same code can unlock after the pair is complete (phone changes, reinstalls). */
const MAX_RESTORES = 2;
// No limit users feel: this only stops a script from draining the AI
// allowance that everyone shares.
const DEFAULT_FREE_AI_DAILY_LIMIT = 100;
const DEFAULT_PREMIUM_AI_DAILY_LIMIT = 100;

export type DeviceStatus = "free" | "trial" | "unlocked" | "paid";
export type EntitlementState = "free" | "unlocked" | "paid";

export type Device = {
  id: string;
  fcmToken: string;
  platform: string;
  locale: string;
  createdAt: number;
  status: DeviceStatus;
  unlockSource: string;
  pairCode: string;
};

export type Entitlement = {
  /** free, unlocked (by an invite code / admin) or paid. */
  state: EntitlementState;
  premium: boolean;
  pairCode: string | null;
  /** True once someone joined this device's code (or this device joined someone's). */
  partnerJoined: boolean;
  /** AI messages a day — fixed questions and chat share it. */
  aiDailyLimit: number;
  /** Left today (UTC day), so the app can show «1 of 2 left». */
  aiRemainingToday: number;
};

function nowMs(): number {
  return Date.now();
}

function rowToDevice(row: Row): Device {
  return {
    id: String(row.id),
    fcmToken: String(row.fcm_token ?? ""),
    platform: String(row.platform ?? ""),
    locale: String(row.locale ?? ""),
    createdAt: Number(row.created_at),
    status: String(row.status) as DeviceStatus,
    unlockSource: String(row.unlock_source ?? ""),
    pairCode: String(row.pair_code ?? "")
  };
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function randomHex(bytes: number): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

// No 0/O/1/I so a code read out loud or typed from a screenshot can't be misread.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(): string {
  const buf = crypto.getRandomValues(new Uint8Array(5));
  const body = Array.from(buf, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
  return `PZ-${body}`;
}

export function normalizeCode(input: string): string {
  const upper = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = upper.startsWith("PZ") ? upper.slice(2) : upper;
  return body.length === 5 ? `PZ-${body}` : "";
}

export async function registerDevice(input: {platform: string; appVersion: string; locale: string}): Promise<{
  device: Device;
  token: string;
}> {
  const token = randomHex(32);
  const id = crypto.randomUUID();
  const now = nowMs();
  await pauzoQuery(
    `INSERT INTO pauzo_devices (id, token_hash, platform, app_version, locale, created_at, last_seen_at, trial_ends_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    // trial_ends_at is a leftover of the old trial model; unused.
    [id, await sha256Hex(token), input.platform, input.appVersion, input.locale, now, now, now]
  );
  const device = (await getDevice(id))!;
  return {device, token};
}

export async function findDeviceByToken(token: string): Promise<Device | null> {
  const rows = await pauzoQuery(`SELECT * FROM pauzo_devices WHERE token_hash = ?`, [await sha256Hex(token)]);
  if (!rows[0]) return null;
  const device = rowToDevice(rows[0]);
  // Fire-and-forget would be nicer, but Workers may end the request first.
  await pauzoQuery(`UPDATE pauzo_devices SET last_seen_at = ? WHERE id = ?`, [nowMs(), device.id]);
  return device;
}

export async function getDevice(id: string): Promise<Device | null> {
  const rows = await pauzoQuery(`SELECT * FROM pauzo_devices WHERE id = ?`, [id]);
  return rows[0] ? rowToDevice(rows[0]) : null;
}

export async function touchDevice(
  id: string,
  input: {appVersion?: string; locale?: string; fcmToken?: string}
): Promise<void> {
  const sets: string[] = ["last_seen_at = ?"];
  const params: (string | number)[] = [nowMs()];
  if (input.appVersion) {
    sets.push("app_version = ?");
    params.push(input.appVersion);
  }
  if (input.locale) {
    sets.push("locale = ?");
    params.push(input.locale);
  }
  if (input.fcmToken) {
    sets.push("fcm_token = ?");
    params.push(input.fcmToken);
  }
  params.push(id);
  await pauzoQuery(`UPDATE pauzo_devices SET ${sets.join(", ")} WHERE id = ?`, params);
}

function envLimit(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

export function aiDailyLimit(premium: boolean): number {
  return premium
    ? envLimit("PAUZO_AI_PREMIUM_DAILY_LIMIT", DEFAULT_PREMIUM_AI_DAILY_LIMIT)
    : envLimit("PAUZO_AI_DAILY_LIMIT", DEFAULT_FREE_AI_DAILY_LIMIT);
}

export async function getEntitlement(device: Device): Promise<Entitlement> {
  let partnerJoined = false;
  if (device.pairCode) {
    const rows = await pauzoQuery(`SELECT partner_id FROM pauzo_pairs WHERE code = ?`, [device.pairCode]);
    partnerJoined = String(rows[0]?.partner_id ?? "") !== "";
  }
  // A completed pair counts even if the status update after the join was lost.
  const state: EntitlementState =
    device.status === "paid" ? "paid" : device.status === "unlocked" || partnerJoined ? "unlocked" : "free";
  const premium = state !== "free";
  const limit = aiDailyLimit(premium);
  return {
    state,
    premium,
    pairCode: device.pairCode || null,
    partnerJoined,
    aiDailyLimit: limit,
    aiRemainingToday: Math.max(0, limit - (await aiUsedToday(device.id)))
  };
}

/** One code per device: creating again returns the same code. */
export async function createPairCode(device: Device): Promise<string> {
  if (device.pairCode) {
    const existing = await pauzoQuery(`SELECT creator_id FROM pauzo_pairs WHERE code = ?`, [device.pairCode]);
    if (existing[0]) return device.pairCode;
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    try {
      await pauzoBatch([
        {
          sql: `INSERT INTO pauzo_pairs (code, creator_id, created_at) VALUES (?, ?, ?)`,
          params: [code, device.id, nowMs()]
        },
        {sql: `UPDATE pauzo_devices SET pair_code = ? WHERE id = ?`, params: [code, device.id]}
      ]);
      return code;
    } catch (error) {
      if (!/UNIQUE constraint failed/i.test(error instanceof Error ? error.message : "")) throw error;
    }
  }
  throw new Error("code_generation_failed");
}

export type JoinResult = "joined" | "invalid_code" | "own_code" | "pair_full" | "already_paired";

function isReviewerCode(code: string): boolean {
  const reviewer = process.env.PAUZO_REVIEWER_CODE?.trim();
  return Boolean(reviewer) && code === normalizeCode(reviewer!);
}

async function markUnlocked(ids: string[], source: string, code: string): Promise<void> {
  const now = nowMs();
  await pauzoBatch(
    ids.map((id) => ({
      sql: `UPDATE pauzo_devices SET status = 'unlocked', unlock_source = ?, unlocked_at = ?, pair_code = ?
            WHERE id = ? AND status <> 'paid'`,
      params: [source, now, code, id]
    }))
  );
}

/**
 * Second phone enters the code: the pair closes and both devices unlock.
 * The conditional UPDATE is what makes a code usable exactly once; the
 * SELECT after it tells us whether this request was the one that won.
 */
export async function joinPair(device: Device, rawCode: string): Promise<JoinResult> {
  const code = normalizeCode(rawCode);
  if (!code) return "invalid_code";
  if (isReviewerCode(code)) {
    await markUnlocked([device.id], "reviewer", "");
    return "joined";
  }
  if (device.status === "unlocked" || device.status === "paid") return "already_paired";
  if (device.pairCode === code) return "own_code";

  const [, rows] = await pauzoBatch([
    {
      sql: `UPDATE pauzo_pairs SET partner_id = ?, joined_at = ?
            WHERE code = ? AND partner_id = '' AND creator_id <> ?`,
      params: [device.id, nowMs(), code, device.id]
    },
    {sql: `SELECT creator_id, partner_id FROM pauzo_pairs WHERE code = ?`, params: [code]}
  ]);
  const pair = rows?.[0];
  if (!pair) return "invalid_code";
  const creatorId = String(pair.creator_id);
  const partnerId = String(pair.partner_id ?? "");
  if (creatorId === device.id) return "own_code";
  if (partnerId !== device.id) return "pair_full";

  await markUnlocked([creatorId, device.id], "pair", code);
  const creator = await getDevice(creatorId);
  if (creator?.fcmToken) await sendPartnerJoinedPush(creator.fcmToken, creator.locale);
  return "joined";
}

export type RestoreResult = "restored" | "invalid_code" | "pair_incomplete" | "restore_limit";

/** A phone change or reinstall: the same completed code unlocks a few more installs. */
export async function restoreWithCode(device: Device, rawCode: string): Promise<RestoreResult> {
  const code = normalizeCode(rawCode);
  if (!code) return "invalid_code";
  const rows = await pauzoQuery(`SELECT partner_id, restores FROM pauzo_pairs WHERE code = ?`, [code]);
  const pair = rows[0];
  if (!pair) return "invalid_code";
  if (String(pair.partner_id ?? "") === "") return "pair_incomplete";
  if (device.status === "unlocked" && device.pairCode === code) return "restored";
  if (Number(pair.restores) >= MAX_RESTORES) return "restore_limit";
  await pauzoBatch([
    {sql: `UPDATE pauzo_pairs SET restores = restores + 1 WHERE code = ?`, params: [code]},
    {
      sql: `UPDATE pauzo_devices SET status = 'unlocked', unlock_source = 'restore', unlocked_at = ?, pair_code = ?
            WHERE id = ? AND status <> 'paid'`,
      params: [nowMs(), code, device.id]
    }
  ]);
  return "restored";
}

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

async function aiUsedToday(deviceId: string): Promise<number> {
  const rows = await pauzoQuery(`SELECT count FROM pauzo_counters WHERE key = ? AND day = ?`, [`ai:${deviceId}`, utcDay()]);
  return Number(rows[0]?.count ?? 0);
}

/** Returns false when the device has used up today's AI questions. */
export async function consumeAiQuota(device: Device, premium: boolean): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  const count = await bumpDailyCounter(`ai:${device.id}`, day);
  return count <= aiDailyLimit(premium);
}

export async function refundAiQuota(device: Device): Promise<void> {
  await pauzoQuery(`UPDATE pauzo_counters SET count = MAX(count - 1, 0) WHERE key = ? AND day = ?`, [`ai:${device.id}`, utcDay()]);
}

export async function consumeIpQuota(ip: string, action: string, limit: number): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  const count = await bumpDailyCounter(`${action}:${ip}`, day);
  return count <= limit;
}

export type PauzoStats = {
  devices: number;
  activeLast7Days: number;
  /** Purchases (one per buyer, however many reinstalls). */
  purchases: number;
  purchasesLast7Days: number;
  free: number;
  unlocked: number;
  paid: number;
  pairsCreated: number;
  pairsCompleted: number;
  aiQuestionsToday: number;
  /** Requests sent to Gemini today (Google's day), per model. */
  geminiToday: {model: string; count: number}[];
  geminiDailyLimit: number;
  /** Requests answered first by Cloudflare Workers AI today. */
  workersAiToday: number;
  /** Requests sent to Groq, the second choice, today. */
  groqToday: number;
};

export async function getPauzoStats(): Promise<PauzoStats> {
  const weekAgo = nowMs() - 7 * DAY_MS;
  const today = new Date().toISOString().slice(0, 10);
  const [devices, pairs, ai, purchases, gemini] = await pauzoBatch([
    {
      sql: `SELECT COUNT(*) AS devices,
              SUM(CASE WHEN last_seen_at >= ? THEN 1 ELSE 0 END) AS active,
              SUM(CASE WHEN status NOT IN ('unlocked', 'paid') THEN 1 ELSE 0 END) AS free,
              SUM(CASE WHEN status = 'unlocked' THEN 1 ELSE 0 END) AS unlocked,
              SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid
            FROM pauzo_devices`,
      params: [weekAgo]
    },
    {
      sql: `SELECT COUNT(*) AS created, SUM(CASE WHEN partner_id <> '' THEN 1 ELSE 0 END) AS completed FROM pauzo_pairs`
    },
    {sql: `SELECT COALESCE(SUM(count), 0) AS total FROM pauzo_counters WHERE day = ? AND key LIKE 'ai:%'`, params: [today]},
    {
      sql: `SELECT COUNT(*) AS total, SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS recent FROM pauzo_purchases`,
      params: [weekAgo]
    },
    {
      sql: `SELECT key, count FROM pauzo_counters WHERE day = ? AND (key LIKE 'gemini:%' OR key LIKE 'wai:%' OR key LIKE 'groq:%') ORDER BY count DESC`,
      params: [geminiQuotaDay()]
    }
  ]);
  const d = devices?.[0] ?? {};
  const p = pairs?.[0] ?? {};
  return {
    devices: Number(d.devices ?? 0),
    activeLast7Days: Number(d.active ?? 0),
    purchases: Number(purchases?.[0]?.total ?? 0),
    purchasesLast7Days: Number(purchases?.[0]?.recent ?? 0),
    free: Number(d.free ?? 0),
    unlocked: Number(d.unlocked ?? 0),
    paid: Number(d.paid ?? 0),
    pairsCreated: Number(p.created ?? 0),
    pairsCompleted: Number(p.completed ?? 0),
    aiQuestionsToday: Number(ai?.[0]?.total ?? 0),
    geminiToday: (gemini ?? [])
      .filter((r) => String(r.key).startsWith("gemini:"))
      .map((r) => ({model: String(r.key).replace(/^gemini:/, ""), count: Number(r.count ?? 0)})),
    workersAiToday: (gemini ?? [])
      .filter((r) => String(r.key).startsWith("wai:"))
      .reduce((n, r) => n + Number(r.count ?? 0), 0),
    groqToday: (gemini ?? [])
      .filter((r) => String(r.key).startsWith("groq:"))
      .reduce((n, r) => n + Number(r.count ?? 0), 0),
    geminiDailyLimit: GEMINI_FREE_REQUESTS_PER_MODEL * GEMINI_MODELS_TRIED
  };
}

/** Marks a device paid after the store confirmed the purchase; idempotent per transaction. */
export async function recordPurchase(
  device: Device,
  input: {platform: string; productId: string; transactionId: string}
): Promise<"paid" | "used_elsewhere"> {
  const existing = await pauzoQuery(
    `SELECT device_id FROM pauzo_purchases WHERE platform = ? AND transaction_id = ?`,
    [input.platform, input.transactionId]
  );
  const owner = existing[0] ? String(existing[0].device_id) : null;
  // A reinstall restores the same purchase onto its new device id; a
  // stranger replaying someone else's receipt would need that receipt.
  if (owner && owner !== device.id) {
    const previous = await getDevice(owner);
    if (previous && previous.platform === device.platform && previous.status === "paid") {
      // One purchase, one paid install: the old install (uninstalled or on
      // the phone that was replaced) loses it as this one gets it.
      const now = nowMs();
      await pauzoBatch([
        {
          sql: `UPDATE pauzo_purchases SET device_id = ?, restores = restores + 1, restored_at = ?
                WHERE platform = ? AND transaction_id = ?`,
          params: [device.id, now, input.platform, input.transactionId]
        },
        {
          sql: `UPDATE pauzo_devices SET status = 'free', unlock_source = 'moved' WHERE id = ?`,
          params: [previous.id]
        }
      ]);
    } else if (previous) {
      return "used_elsewhere";
    }
  }
  const now = nowMs();
  await pauzoBatch([
    {
      sql: `INSERT INTO pauzo_purchases (id, device_id, platform, product_id, transaction_id, verified, created_at)
            VALUES (?, ?, ?, ?, ?, 1, ?)
            ON CONFLICT(platform, transaction_id) DO NOTHING`,
      params: [crypto.randomUUID(), device.id, input.platform, input.productId, input.transactionId, now]
    },
    {
      sql: `UPDATE pauzo_devices SET status = 'paid', unlock_source = 'purchase', unlocked_at = ? WHERE id = ?`,
      params: [now, device.id]
    }
  ]);
  return "paid";
}

// ---------------------------------------------------------------- admin

export type AdminDeviceFilter = "all" | "free" | "unlocked" | "paid";

export type AdminDevice = {
  id: string;
  platform: string;
  appVersion: string;
  locale: string;
  createdAt: number;
  lastSeenAt: number;
  state: EntitlementState;
  unlockSource: string;
  unlockedAt: number;
  pairCode: string;
};

export type AdminPair = {
  code: string;
  creatorId: string;
  creatorPlatform: string;
  creatorLocale: string;
  partnerId: string;
  partnerPlatform: string;
  partnerLocale: string;
  restores: number;
  createdAt: number;
  joinedAt: number;
};

const ADMIN_PAGE_SIZE = 50;

export type DailyCount = {day: string; registered: number; unlocked: number};

export type AdminPurchase = {
  transactionId: string;
  platform: string;
  productId: string;
  verified: boolean;
  createdAt: number;
  restores: number;
  restoredAt: number;
  deviceId: string;
  deviceLocale: string;
  deviceAppVersion: string;
  deviceLastSeenAt: number;
};

export async function listPurchases(): Promise<AdminPurchase[]> {
  const rows = await pauzoQuery(
    `SELECT p.*, d.locale AS d_locale, d.app_version AS d_version, d.last_seen_at AS d_seen
     FROM pauzo_purchases p LEFT JOIN pauzo_devices d ON d.id = p.device_id
     ORDER BY p.created_at DESC LIMIT ${ADMIN_PAGE_SIZE}`
  );
  return rows.map((row) => ({
    transactionId: String(row.transaction_id),
    platform: String(row.platform),
    productId: String(row.product_id),
    verified: Number(row.verified) === 1,
    createdAt: Number(row.created_at),
    restores: Number(row.restores ?? 0),
    restoredAt: Number(row.restored_at ?? 0),
    deviceId: String(row.device_id),
    deviceLocale: String(row.d_locale ?? ""),
    deviceAppVersion: String(row.d_version ?? ""),
    deviceLastSeenAt: Number(row.d_seen ?? 0)
  }));
}


function rowToAdminDevice(row: Row, now: number): AdminDevice {
  const status = String(row.status);
  const state: EntitlementState = status === "paid" ? "paid" : status === "unlocked" ? "unlocked" : "free";
  return {
    id: String(row.id),
    platform: String(row.platform ?? ""),
    appVersion: String(row.app_version ?? ""),
    locale: String(row.locale ?? ""),
    createdAt: Number(row.created_at),
    lastSeenAt: Number(row.last_seen_at),
    state,
    unlockSource: String(row.unlock_source ?? ""),
    unlockedAt: Number(row.unlocked_at ?? 0),
    pairCode: String(row.pair_code ?? "")
  };
}

/** Newest first; [query] matches a device id prefix or a pair code. */
export async function listDevices(filter: AdminDeviceFilter, query: string): Promise<AdminDevice[]> {
  const now = nowMs();
  const where: string[] = [];
  const params: (string | number)[] = [];
  switch (filter) {
    case "free":
      where.push("status NOT IN ('unlocked', 'paid')");
      break;
    case "unlocked":
    case "paid":
      where.push("status = ?");
      params.push(filter);
      break;
    case "all":
      break;
  }
  const q = query.trim();
  if (q) {
    const code = normalizeCode(q);
    where.push(code ? "(id LIKE ? OR pair_code = ?)" : "id LIKE ?");
    params.push(`${q.toLowerCase()}%`);
    if (code) params.push(code);
  }
  const rows = await pauzoQuery(
    `SELECT * FROM pauzo_devices ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY created_at DESC LIMIT ${ADMIN_PAGE_SIZE}`,
    params
  );
  return rows.map((row) => rowToAdminDevice(row, now));
}

export async function listPairs(): Promise<AdminPair[]> {
  const rows = await pauzoQuery(
    `SELECT p.*, c.platform AS c_platform, c.locale AS c_locale,
            d.platform AS p_platform, d.locale AS p_locale
     FROM pauzo_pairs p
     LEFT JOIN pauzo_devices c ON c.id = p.creator_id
     LEFT JOIN pauzo_devices d ON d.id = p.partner_id
     ORDER BY p.created_at DESC LIMIT ${ADMIN_PAGE_SIZE}`
  );
  return rows.map((row) => ({
    code: String(row.code),
    creatorId: String(row.creator_id),
    creatorPlatform: String(row.c_platform ?? ""),
    creatorLocale: String(row.c_locale ?? ""),
    partnerId: String(row.partner_id ?? ""),
    partnerPlatform: String(row.p_platform ?? ""),
    partnerLocale: String(row.p_locale ?? ""),
    restores: Number(row.restores ?? 0),
    createdAt: Number(row.created_at),
    joinedAt: Number(row.joined_at ?? 0)
  }));
}

/** New installs and unlocks per UTC day, oldest first, zero-filled. */
export async function dailyCounts(days: number): Promise<DailyCount[]> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const since = start.getTime();
  const [registered, unlocked] = await pauzoBatch([
    {
      sql: `SELECT CAST((created_at - ?) / ${DAY_MS} AS INTEGER) AS d, COUNT(*) AS n FROM pauzo_devices
            WHERE created_at >= ? GROUP BY d`,
      params: [since, since]
    },
    {
      sql: `SELECT CAST((unlocked_at - ?) / ${DAY_MS} AS INTEGER) AS d, COUNT(*) AS n FROM pauzo_devices
            WHERE unlocked_at >= ? GROUP BY d`,
      params: [since, since]
    }
  ]);
  const byIndex = (rows: Row[] | undefined) => {
    const map = new Map<number, number>();
    for (const row of rows ?? []) map.set(Math.floor(Number(row.d)), Number(row.n));
    return map;
  };
  const reg = byIndex(registered);
  const unl = byIndex(unlocked);
  return Array.from({length: days}, (_, i) => ({
    day: new Date(since + i * DAY_MS).toISOString().slice(0, 10),
    registered: reg.get(i) ?? 0,
    unlocked: unl.get(i) ?? 0
  }));
}

export type AdminDeviceAction = "unlock" | "revoke";

/** Support actions: `unlock` gives a device premium; `revoke` takes back a premium the admin gave. */
export async function adminUpdateDevice(id: string, action: AdminDeviceAction): Promise<boolean> {
  const before = await getDevice(id);
  if (!before) return false;
  switch (action) {
    case "unlock":
      await pauzoQuery(
        `UPDATE pauzo_devices SET status = 'unlocked', unlock_source = 'admin', unlocked_at = ?
         WHERE id = ? AND status <> 'paid'`,
        [nowMs(), id]
      );
      break;
    case "revoke":
      await pauzoQuery(
        `UPDATE pauzo_devices SET status = 'free', unlock_source = '', unlocked_at = 0
         WHERE id = ? AND unlock_source = 'admin'`,
        [id]
      );
      break;
  }
  return true;
}
