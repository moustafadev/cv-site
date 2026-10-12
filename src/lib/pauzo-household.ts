import {pauzoBatch, pauzoQuery} from "@/lib/pauzo-db";
import type {Stmt} from "@/lib/blog-db";
import type {Device} from "@/lib/pauzo";

/**
 * Shared budget: up to [MAX_MEMBERS] phones join one household by code, and
 * each pushes its own operations so the others can see the family's month.
 * Operations stay owned by the phone that recorded them; leaving deletes
 * them from the server.
 */

export const MAX_MEMBERS = 4;
/** One sync carries at most this many changes; the app sends the rest next time. */
export const MAX_SYNC_CHANGES = 200;

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CATEGORIES = new Set(["shopping", "travel", "education", "home", "health", "subscriptions", "other"]);

/** [key] prefixes the ids of that member's operations in a sync. */
export type HouseholdMember = {key: string; name: string; isMe: boolean; joinedAt: number};
export type Household = {code: string; members: HouseholdMember[]};

export type SharedOp = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  day: string;
  note: string;
  recurring: boolean;
  recurringEnabled: boolean;
};

export type RemoteOp = SharedOp & {member: string; deleted: boolean};

export class HouseholdError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

function memberKey(deviceId: string): string {
  return deviceId.replace(/-/g, "").slice(0, 10);
}

function randomHouseholdCode(): string {
  const buf = crypto.getRandomValues(new Uint8Array(5));
  return `HB-${Array.from(buf, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("")}`;
}

export function normalizeHouseholdCode(input: string): string {
  const upper = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = upper.startsWith("HB") ? upper.slice(2) : upper;
  return body.length === 5 ? `HB-${body}` : "";
}

function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, 30);
}

async function membershipOf(deviceId: string): Promise<string | null> {
  const rows = await pauzoQuery(`SELECT household_code FROM pauzo_household_members WHERE device_id = ?`, [deviceId]);
  return rows[0] ? String(rows[0].household_code) : null;
}

export async function getHousehold(device: Device): Promise<Household | null> {
  const code = await membershipOf(device.id);
  if (!code) return null;
  const rows = await pauzoQuery(
    `SELECT device_id, name, joined_at FROM pauzo_household_members WHERE household_code = ? ORDER BY joined_at`,
    [code]
  );
  return {
    code,
    members: rows.map((r) => ({
      key: memberKey(String(r.device_id)),
      name: String(r.name ?? ""),
      isMe: String(r.device_id) === device.id,
      joinedAt: Number(r.joined_at)
    }))
  };
}

/** Creating again returns the household this phone is already in. */
export async function createHousehold(device: Device, name: string): Promise<Household> {
  const existing = await getHousehold(device);
  if (existing) return existing;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomHouseholdCode();
    try {
      const now = Date.now();
      await pauzoBatch([
        {sql: `INSERT INTO pauzo_households (code, created_by, created_at) VALUES (?, ?, ?)`, params: [code, device.id, now]},
        {
          sql: `INSERT INTO pauzo_household_members (device_id, household_code, name, joined_at) VALUES (?, ?, ?, ?)`,
          params: [device.id, code, cleanName(name), now]
        }
      ]);
      return (await getHousehold(device))!;
    } catch (error) {
      if (!/UNIQUE constraint failed/i.test(error instanceof Error ? error.message : "")) throw error;
    }
  }
  throw new Error("code_generation_failed");
}

export async function joinHousehold(device: Device, rawCode: string, name: string): Promise<Household> {
  const code = normalizeHouseholdCode(rawCode);
  if (!code) throw new HouseholdError("invalid_code");
  const current = await membershipOf(device.id);
  if (current === code) return (await getHousehold(device))!;
  if (current) throw new HouseholdError("already_in_household");
  const exists = await pauzoQuery(`SELECT code FROM pauzo_households WHERE code = ?`, [code]);
  if (!exists[0]) throw new HouseholdError("invalid_code");
  // Conditional insert: two phones joining at once can't push it past the limit.
  const [, check] = await pauzoBatch([
    {
      sql: `INSERT INTO pauzo_household_members (device_id, household_code, name, joined_at)
            SELECT ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM pauzo_household_members WHERE household_code = ?) < ?`,
      params: [device.id, code, cleanName(name), Date.now(), code, MAX_MEMBERS]
    },
    {sql: `SELECT household_code FROM pauzo_household_members WHERE device_id = ?`, params: [device.id]}
  ]);
  if (!check?.[0]) throw new HouseholdError("household_full");
  return (await getHousehold(device))!;
}

export async function renameMember(device: Device, name: string): Promise<void> {
  await pauzoQuery(`UPDATE pauzo_household_members SET name = ? WHERE device_id = ?`, [cleanName(name), device.id]);
}

/** The phone's operations leave with it; an empty household is removed. */
export async function leaveHousehold(device: Device): Promise<void> {
  const code = await membershipOf(device.id);
  if (!code) return;
  await pauzoBatch([
    {sql: `DELETE FROM pauzo_shared_ops WHERE device_id = ?`, params: [device.id]},
    {sql: `DELETE FROM pauzo_household_members WHERE device_id = ?`, params: [device.id]},
    {
      sql: `DELETE FROM pauzo_households WHERE code = ?
            AND NOT EXISTS (SELECT 1 FROM pauzo_household_members WHERE household_code = ?)`,
      params: [code, code]
    }
  ]);
}

function cleanOp(value: unknown): SharedOp | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const id = typeof v.id === "string" ? v.id.slice(0, 64) : "";
  const amount = Math.round(Number(v.amount));
  const day = typeof v.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.day) ? v.day : "";
  if (!id || !day || !Number.isFinite(amount) || amount < 0 || amount > 1_000_000_000) return null;
  return {
    id,
    type: v.type === "income" ? "income" : "expense",
    amount,
    category: CATEGORIES.has(String(v.category)) ? String(v.category) : "other",
    day,
    note: typeof v.note === "string" ? v.note.trim().slice(0, 60) : "",
    recurring: v.recurring === true,
    recurringEnabled: v.recurringEnabled !== false
  };
}

/**
 * Stores this phone's changes, then returns everyone else's changes since
 * [since] (deletions included, so the other phones can drop them).
 */
export async function syncHousehold(
  device: Device,
  input: {upserts: unknown[]; deletes: unknown[]; since: number}
): Promise<{ops: RemoteOp[]; serverTime: number; household: Household}> {
  const household = await getHousehold(device);
  if (!household) throw new HouseholdError("no_household");
  const now = Date.now();
  const stmts: Stmt[] = [];
  for (const raw of input.upserts.slice(0, MAX_SYNC_CHANGES)) {
    const op = cleanOp(raw);
    if (!op) continue;
    stmts.push({
      sql: `INSERT INTO pauzo_shared_ops
              (device_id, op_id, household_code, type, amount, category, day, note, recurring, recurring_enabled, deleted, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
            ON CONFLICT(device_id, op_id) DO UPDATE SET
              household_code = excluded.household_code, type = excluded.type, amount = excluded.amount,
              category = excluded.category, day = excluded.day, note = excluded.note,
              recurring = excluded.recurring, recurring_enabled = excluded.recurring_enabled,
              deleted = 0, updated_at = excluded.updated_at`,
      params: [
        device.id,
        op.id,
        household.code,
        op.type,
        op.amount,
        op.category,
        op.day,
        op.note,
        op.recurring ? 1 : 0,
        op.recurringEnabled ? 1 : 0,
        now
      ]
    });
  }
  for (const id of input.deletes.slice(0, MAX_SYNC_CHANGES)) {
    if (typeof id !== "string" || !id) continue;
    stmts.push({
      sql: `UPDATE pauzo_shared_ops SET deleted = 1, updated_at = ? WHERE device_id = ? AND op_id = ?`,
      params: [now, device.id, id.slice(0, 64)]
    });
  }
  if (stmts.length) await pauzoBatch(stmts);

  const since = Number.isFinite(input.since) && input.since > 0 ? input.since : 0;
  const rows = await pauzoQuery(
    `SELECT o.*, m.name AS member_name FROM pauzo_shared_ops o
       JOIN pauzo_household_members m ON m.device_id = o.device_id AND m.household_code = o.household_code
     WHERE o.household_code = ? AND o.device_id != ? AND o.updated_at > ?
     ORDER BY o.updated_at LIMIT 2000`,
    [household.code, device.id, since]
  );
  const ops: RemoteOp[] = rows.map((r) => ({
    // Two phones can use the same local id; the owner makes it unique here.
    id: `${memberKey(String(r.device_id))}:${String(r.op_id)}`,
    member: String(r.member_name ?? ""),
    type: r.type === "income" ? "income" : "expense",
    amount: Number(r.amount),
    category: String(r.category),
    day: String(r.day),
    note: String(r.note ?? ""),
    recurring: Number(r.recurring) === 1,
    recurringEnabled: Number(r.recurring_enabled) === 1,
    deleted: Number(r.deleted) === 1
  }));
  // A member who left takes their operations along: the app drops cached
  // operations whose key isn't among the members any more.
  return {ops, serverTime: now, household};
}
