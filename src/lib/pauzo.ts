import {bumpDailyCounter, pauzoBatch, pauzoQuery} from "@/lib/pauzo-db";
import type {Row} from "@/lib/blog-db";

/**
 * Pauzo unlock rules: every install gets a 7-day trial; a device that
 * creates a pair code and a device that joins it are both unlocked for good;
 * a verified one-time purchase unlocks a device on its own.
 */

export const TRIAL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Extra installs the same code can unlock after the pair is complete (phone changes, reinstalls). */
const MAX_RESTORES = 2;
const DEFAULT_AI_DAILY_LIMIT = 10;

export type DeviceStatus = "trial" | "unlocked" | "paid";
export type EntitlementState = "trial" | "unlocked" | "paid" | "expired";

export type Device = {
  id: string;
  platform: string;
  locale: string;
  createdAt: number;
  trialEndsAt: number;
  status: DeviceStatus;
  unlockSource: string;
  pairCode: string;
};

export type Entitlement = {
  state: EntitlementState;
  trialEndsAt: number;
  /** Whole days left in the trial, 0 once it has run out. */
  trialDaysLeft: number;
  pairCode: string | null;
  /** True once someone joined this device's code (or this device joined someone's). */
  partnerJoined: boolean;
  aiDailyLimit: number;
};

function nowMs(): number {
  return Date.now();
}

function rowToDevice(row: Row): Device {
  return {
    id: String(row.id),
    platform: String(row.platform ?? ""),
    locale: String(row.locale ?? ""),
    createdAt: Number(row.created_at),
    trialEndsAt: Number(row.trial_ends_at),
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
    [id, await sha256Hex(token), input.platform, input.appVersion, input.locale, now, now, now + TRIAL_DAYS * DAY_MS]
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

export async function touchDevice(id: string, input: {appVersion?: string; locale?: string}): Promise<void> {
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
  params.push(id);
  await pauzoQuery(`UPDATE pauzo_devices SET ${sets.join(", ")} WHERE id = ?`, params);
}

export function aiDailyLimit(): number {
  const raw = Number(process.env.PAUZO_AI_DAILY_LIMIT);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_AI_DAILY_LIMIT;
}

export async function getEntitlement(device: Device): Promise<Entitlement> {
  let partnerJoined = false;
  if (device.pairCode) {
    const rows = await pauzoQuery(`SELECT partner_id FROM pauzo_pairs WHERE code = ?`, [device.pairCode]);
    partnerJoined = String(rows[0]?.partner_id ?? "") !== "";
  }
  // A completed pair unlocks even if the status update after the join was lost.
  const unlocked = device.status === "unlocked" || (partnerJoined && device.unlockSource !== "reviewer");
  const now = nowMs();
  const state: EntitlementState =
    device.status === "paid" ? "paid" : unlocked ? "unlocked" : now < device.trialEndsAt ? "trial" : "expired";
  return {
    state,
    trialEndsAt: device.trialEndsAt,
    trialDaysLeft: state === "trial" ? Math.max(1, Math.ceil((device.trialEndsAt - now) / DAY_MS)) : 0,
    pairCode: device.pairCode || null,
    partnerJoined,
    aiDailyLimit: aiDailyLimit()
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

/** Returns false when the device has used up today's AI questions. */
export async function consumeAiQuota(device: Device): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  const count = await bumpDailyCounter(`ai:${device.id}`, day);
  return count <= aiDailyLimit();
}

export async function consumeIpQuota(ip: string, action: string, limit: number): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  const count = await bumpDailyCounter(`${action}:${ip}`, day);
  return count <= limit;
}

export type PauzoStats = {
  devices: number;
  activeLast7Days: number;
  trial: number;
  unlocked: number;
  paid: number;
  pairsCreated: number;
  pairsCompleted: number;
  aiQuestionsToday: number;
};

export async function getPauzoStats(): Promise<PauzoStats> {
  const weekAgo = nowMs() - 7 * DAY_MS;
  const today = new Date().toISOString().slice(0, 10);
  const [devices, pairs, ai] = await pauzoBatch([
    {
      sql: `SELECT COUNT(*) AS devices,
              SUM(CASE WHEN last_seen_at >= ? THEN 1 ELSE 0 END) AS active,
              SUM(CASE WHEN status = 'trial' THEN 1 ELSE 0 END) AS trial,
              SUM(CASE WHEN status = 'unlocked' THEN 1 ELSE 0 END) AS unlocked,
              SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid
            FROM pauzo_devices`,
      params: [weekAgo]
    },
    {
      sql: `SELECT COUNT(*) AS created, SUM(CASE WHEN partner_id <> '' THEN 1 ELSE 0 END) AS completed FROM pauzo_pairs`
    },
    {sql: `SELECT COALESCE(SUM(count), 0) AS total FROM pauzo_counters WHERE day = ? AND key LIKE 'ai:%'`, params: [today]}
  ]);
  const d = devices?.[0] ?? {};
  const p = pairs?.[0] ?? {};
  return {
    devices: Number(d.devices ?? 0),
    activeLast7Days: Number(d.active ?? 0),
    trial: Number(d.trial ?? 0),
    unlocked: Number(d.unlocked ?? 0),
    paid: Number(d.paid ?? 0),
    pairsCreated: Number(p.created ?? 0),
    pairsCompleted: Number(p.completed ?? 0),
    aiQuestionsToday: Number(ai?.[0]?.total ?? 0)
  };
}
