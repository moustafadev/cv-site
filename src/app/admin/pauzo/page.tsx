"use client";

import {useCallback, useEffect, useState} from "react";

type State = "free" | "unlocked" | "paid";
type Filter = "all" | State;
type Action = "unlock" | "revoke";

type Stats = {
  devices: number;
  activeLast7Days: number;
  purchases: number;
  purchasesLast7Days: number;
  free: number;
  unlocked: number;
  paid: number;
  pairsCreated: number;
  pairsCompleted: number;
  aiQuestionsToday: number;
};

type Device = {
  id: string;
  platform: string;
  appVersion: string;
  locale: string;
  createdAt: number;
  lastSeenAt: number;
  state: State;
  unlockSource: string;
  unlockedAt: number;
  pairCode: string;
};

type Pair = {
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

type Daily = {day: string; registered: number; unlocked: number};

type Purchase = {
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

type DatabaseStats = {
  sizeBytes: number | null;
  tables: number | null;
  rowsRead24h: number | null;
  rowsWritten24h: number | null;
  rows: {devices: number; pairs: number; purchases: number; counters: number; oldCounters: number};
  limits: {sizeBytes: number; rowsReadPerDay: number; rowsWrittenPerDay: number};
};

type Payload = {
  ok: boolean;
  configured?: boolean;
  stats?: Stats;
  database?: DatabaseStats | null;
  daily?: Daily[];
  pairs?: Pair[];
  devices?: Device[];
  purchases?: Purchase[];
  error?: string;
};

const FILTERS: {value: Filter; label: string}[] = [
  {value: "all", label: "All"},
  {value: "free", label: "Free"},
  {value: "unlocked", label: "Premium · friend"},
  {value: "paid", label: "Premium · paid"}
];

const STATE_STYLE: Record<State, string> = {
  free: "border-slate-700 bg-slate-900 text-slate-300",
  unlocked: "border-emerald-800/70 bg-emerald-950/50 text-emerald-200",
  paid: "border-sky-800/70 bg-sky-950/50 text-sky-200"
};

const ACTION_LABEL: Record<Action, string> = {
  unlock: "Give premium",
  revoke: "Take premium back"
};

function fmtDate(t: number): string {
  return t ? new Date(t).toLocaleString(undefined, {dateStyle: "medium", timeStyle: "short"}) : "—";
}

function ago(t: number): string {
  if (!t) return "—";
  const minutes = Math.round((Date.now() - t) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

function pct(part: number, whole: number): string {
  return whole ? `${Math.round((part / whole) * 100)}%` : "—";
}

function shortId(id: string): string {
  return id ? id.slice(0, 8) : "—";
}

function deviceLabel(platform: string, locale: string): string {
  return [platform, locale].filter(Boolean).join(" · ") || "—";
}

export default function AdminPauzoPage() {
  const [status, setStatus] = useState<"loading" | "unauthorized" | "ready">("loading");
  const [data, setData] = useState<Payload | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async (f: Filter, q: string) => {
    setError(null);
    try {
      const params = new URLSearchParams({status: f});
      if (q) params.set("q", q);
      const res = await fetch(`/api/admin/pauzo?${params}`, {credentials: "include"});
      if (res.status === 401) {
        setStatus("unauthorized");
        return;
      }
      const json = (await res.json()) as Payload;
      if (!json.ok) {
        setError(json.error ?? "Failed to load");
        return;
      }
      setData(json);
      setStatus("ready");
    } catch {
      setError("Network error");
    }
  }, []);

  useEffect(() => {
    void load(filter, submittedQuery);
  }, [load, filter, submittedQuery]);

  async function act(device: Device, action: Action) {
    const confirmText =
      action === "unlock"
        ? `Give device ${shortId(device.id)} premium for good?`
        : `Take back the premium you gave ${shortId(device.id)}?`;
    if (confirmText && !window.confirm(confirmText)) return;
    setBusyId(device.id);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/pauzo/device", {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({id: device.id, action})
      });
      const json = (await res.json()) as {ok: boolean; error?: string};
      if (!json.ok) {
        setError(json.error ?? "Action failed");
      } else {
        setNotice(`${ACTION_LABEL[action]} → ${shortId(device.id)}`);
        await load(filter, submittedQuery);
      }
    } catch {
      setError("Network error");
    } finally {
      setBusyId(null);
    }
  }

  if (status === "unauthorized") {
    return (
      <Shell>
        <p className="mt-6 text-sm text-slate-300">
          Not logged in.{" "}
          <a href="/admin" className="text-sky-300 underline">
            Log in at /admin
          </a>{" "}
          and come back.
        </p>
      </Shell>
    );
  }

  const stats = data?.stats;

  return (
    <Shell
      actions={
        <button
          type="button"
          onClick={() => void load(filter, submittedQuery)}
          className="rounded-md border border-slate-600 px-3 py-1.5 text-sm hover:border-sky-400"
        >
          Refresh
        </button>
      }
    >
      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      {notice ? <p className="mt-4 text-sm text-emerald-300">{notice}</p> : null}

      {status === "loading" ? <p className="mt-8 text-sm text-slate-400">Loading…</p> : null}

      {data?.configured === false ? (
        <div className="mt-8 rounded-xl border border-amber-800/80 bg-amber-950/40 p-4 text-sm text-amber-100">
          <p className="font-medium">D1 is not configured</p>
          <p className="mt-1 text-amber-200/90">
            Add <code>CLOUDFLARE_ACCOUNT_ID</code>, <code>CLOUDFLARE_D1_DATABASE_ID</code> and{" "}
            <code>CLOUDFLARE_API_TOKEN</code> as <strong>Secrets</strong> in Cloudflare (plain-text variables are dropped
            on every deploy).
          </p>
        </div>
      ) : null}

      {stats ? (
        <>
          <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Installs" value={stats.devices} hint={`${stats.activeLast7Days} active in 7 days`} />
            <StatCard
              label="Paid"
              value={stats.purchases}
              hint={`${stats.purchasesLast7Days} in 7 days · ${pct(stats.purchases, stats.devices)} of installs`}
              tone="sky"
            />
            <StatCard
              label="Premium by a friend"
              value={stats.unlocked}
              hint={`${pct(stats.unlocked, stats.devices)} of installs`}
              tone="emerald"
            />
            <StatCard label="Free" value={stats.free} hint="2 AI questions a day" />
            <StatCard label="Codes created" value={stats.pairsCreated} hint="«Send to a friend» taps" />
            <StatCard
              label="Codes completed"
              value={stats.pairsCompleted}
              hint={`${pct(stats.pairsCompleted, stats.pairsCreated)} of codes got a friend`}
              tone="emerald"
            />
            <StatCard
              label="Invites per install"
              value={stats.devices ? (stats.pairsCompleted / stats.devices).toFixed(2) : "—"}
              hint="completed codes ÷ installs"
            />
            <StatCard label="AI questions today" value={stats.aiQuestionsToday} hint="all devices" />
          </section>

          {data?.database ? <DatabaseSection db={data.database} /> : null}

          <PurchasesSection rows={data?.purchases ?? []} />

          {data?.daily ? <DailyChart rows={data.daily} /> : null}

          <section className="glass-card mt-8 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-sky-200">Devices</h2>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmittedQuery(query.trim());
                }}
              >
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Device id or PZ- code"
                  className="w-56 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
                />
                <button type="submit" className="rounded-md border border-slate-600 px-3 py-1.5 text-sm hover:border-sky-400">
                  Search
                </button>
              </form>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    filter === f.value
                      ? "border-sky-400 bg-sky-950/60 text-sky-100"
                      : "border-slate-700 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="py-2 pr-3">Device</th>
                    <th className="py-2 pr-3">State</th>
                    <th className="py-2 pr-3">Installed</th>
                    <th className="py-2 pr-3">Last seen</th>
                    <th className="py-2 pr-3">Code</th>
                    <th className="py-2">Support</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.devices ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-slate-500">
                        No devices.
                      </td>
                    </tr>
                  ) : (
                    data!.devices!.map((d) => (
                      <tr key={d.id} className="border-b border-slate-800/80 align-top">
                        <td className="py-2 pr-3">
                          <span className="font-mono text-slate-200" title={d.id}>
                            {shortId(d.id)}
                          </span>
                          <div className="text-xs text-slate-500">
                            {deviceLabel(d.platform, d.locale)} {d.appVersion ? `· ${d.appVersion}` : ""}
                          </div>
                        </td>
                        <td className="py-2 pr-3">
                          <span className={`rounded-full border px-2 py-0.5 text-xs ${STATE_STYLE[d.state]}`}>{d.state}</span>
                          <div className="mt-1 text-xs text-slate-500">
                            {d.unlockSource ? `via ${d.unlockSource}` : ""}
                          </div>
                        </td>
                        <td className="py-2 pr-3 text-slate-300">{fmtDate(d.createdAt)}</td>
                        <td className="py-2 pr-3 text-slate-300">{ago(d.lastSeenAt)}</td>
                        <td className="py-2 pr-3 font-mono text-slate-300">{d.pairCode || "—"}</td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-1.5">
                            {d.state === "free" ? (
                              <ActionButton disabled={busyId === d.id} onClick={() => void act(d, "unlock")}>
                                {ACTION_LABEL.unlock}
                              </ActionButton>
                            ) : null}
                            {d.unlockSource === "admin" && d.state === "unlocked" ? (
                              <ActionButton disabled={busyId === d.id} onClick={() => void act(d, "revoke")}>
                                {ACTION_LABEL.revoke}
                              </ActionButton>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-500">Newest 50 matching devices.</p>
          </section>

          <section className="glass-card mt-8 p-5">
            <h2 className="text-lg font-semibold text-sky-200">Invite codes</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="py-2 pr-3">Code</th>
                    <th className="py-2 pr-3">Sender</th>
                    <th className="py-2 pr-3">Friend</th>
                    <th className="py-2 pr-3">Created</th>
                    <th className="py-2 pr-3">Joined</th>
                    <th className="py-2">Restores</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.pairs ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-slate-500">
                        No codes yet.
                      </td>
                    </tr>
                  ) : (
                    data!.pairs!.map((p) => (
                      <tr key={p.code} className="border-b border-slate-800/80">
                        <td className="py-2 pr-3 font-mono text-slate-100">{p.code}</td>
                        <td className="py-2 pr-3 text-slate-300">
                          <span className="font-mono">{shortId(p.creatorId)}</span>{" "}
                          <span className="text-xs text-slate-500">{deviceLabel(p.creatorPlatform, p.creatorLocale)}</span>
                        </td>
                        <td className="py-2 pr-3 text-slate-300">
                          {p.partnerId ? (
                            <>
                              <span className="font-mono">{shortId(p.partnerId)}</span>{" "}
                              <span className="text-xs text-slate-500">{deviceLabel(p.partnerPlatform, p.partnerLocale)}</span>
                            </>
                          ) : (
                            <span className="text-amber-300/80">waiting</span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-slate-300">{fmtDate(p.createdAt)}</td>
                        <td className="py-2 pr-3 text-slate-300">
                          {p.joinedAt ? (
                            <>
                              {fmtDate(p.joinedAt)}
                              <div className="text-xs text-slate-500">
                                after {Math.max(0, Math.round((p.joinedAt - p.createdAt) / 3600000))} h
                              </div>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2 text-slate-300">{p.restores}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-500">Newest 50 codes.</p>
          </section>
        </>
      ) : null}
    </Shell>
  );
}

function Shell({children, actions}: {children: React.ReactNode; actions?: React.ReactNode}) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="container-page max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <a href="/admin" className="text-xs text-slate-400 hover:text-sky-300">
              ← Admin
            </a>
            <h1 className="mt-1 text-2xl font-semibold text-brand-100">Pauzo</h1>
            <p className="mt-1 text-sm text-slate-400">Installs, premium (paid or by a friend), invite codes and AI usage.</p>
          </div>
          {actions}
        </div>
        {children}
      </div>
    </main>
  );
}

const TONE: Record<string, string> = {
  slate: "text-slate-50",
  sky: "text-sky-300",
  emerald: "text-emerald-300",
  amber: "text-amber-300",
  rose: "text-rose-300"
};

function bytes(n: number): string {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function share(used: number, limit: number): string {
  const p = (used / limit) * 100;
  return p < 0.1 ? "<0.1%" : `${p.toFixed(1)}%`;
}

/** Green while under half the free limit, amber to 80%, red beyond. */
function usageTone(used: number | null, limit: number): keyof typeof TONE {
  if (used == null) return "slate";
  const p = used / limit;
  return p < 0.5 ? "emerald" : p < 0.8 ? "amber" : "rose";
}

function DatabaseSection({db}: {db: DatabaseStats}) {
  const {limits, rows} = db;
  return (
    <section className="glass-card mt-8 p-5">
      <h2 className="text-lg font-semibold text-sky-200">Database</h2>
      <p className="mt-1 text-xs text-slate-500">
        Size and usage cover the whole D1 database (the site&apos;s tables too); limits are Cloudflare&apos;s free plan.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Size"
          value={db.sizeBytes == null ? "—" : bytes(db.sizeBytes)}
          hint={db.sizeBytes == null ? "API can't read it" : `${share(db.sizeBytes, limits.sizeBytes)} of ${bytes(limits.sizeBytes)}`}
          tone={usageTone(db.sizeBytes, limits.sizeBytes)}
        />
        <StatCard
          label="Rows read · 24h"
          value={db.rowsRead24h == null ? "—" : db.rowsRead24h.toLocaleString()}
          hint={
            db.rowsRead24h == null
              ? "token lacks Analytics read"
              : `${share(db.rowsRead24h, limits.rowsReadPerDay)} of ${limits.rowsReadPerDay.toLocaleString()} a day`
          }
          tone={usageTone(db.rowsRead24h, limits.rowsReadPerDay)}
        />
        <StatCard
          label="Rows written · 24h"
          value={db.rowsWritten24h == null ? "—" : db.rowsWritten24h.toLocaleString()}
          hint={
            db.rowsWritten24h == null
              ? "token lacks Analytics read"
              : `${share(db.rowsWritten24h, limits.rowsWrittenPerDay)} of ${limits.rowsWrittenPerDay.toLocaleString()} a day`
          }
          tone={usageTone(db.rowsWritten24h, limits.rowsWrittenPerDay)}
        />
        <StatCard label="Tables" value={db.tables ?? "—"} hint="whole database" />
        <StatCard label="Device rows" value={rows.devices.toLocaleString()} hint="pauzo_devices" />
        <StatCard label="Invite code rows" value={rows.pairs.toLocaleString()} hint="pauzo_pairs" />
        <StatCard label="Purchase rows" value={rows.purchases.toLocaleString()} hint="pauzo_purchases" />
        <StatCard
          label="Counter rows"
          value={rows.counters.toLocaleString()}
          hint={`${rows.oldCounters.toLocaleString()} older than 2 days — never read again`}
          tone={rows.oldCounters > 10_000 ? "rose" : "slate"}
        />
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone = "slate"
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: keyof typeof TONE;
}) {
  return (
    <div className="glass-card p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${TONE[tone]}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function ActionButton({children, onClick, disabled}: {children: React.ReactNode; onClick: () => void; disabled?: boolean}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-slate-600 px-2 py-1 text-xs hover:border-sky-400 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

/** Two bars per day: installs (sky) and unlocks (emerald), scaled to the busiest day. */
function DailyChart({rows}: {rows: Daily[]}) {
  const peak = Math.max(1, ...rows.map((r) => Math.max(r.registered, r.unlocked)));
  const totalReg = rows.reduce((n, r) => n + r.registered, 0);
  const totalUnl = rows.reduce((n, r) => n + r.unlocked, 0);
  return (
    <section className="glass-card mt-8 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-sky-200">Last 14 days</h2>
        <p className="text-xs text-slate-400">
          <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-sky-400" /> {totalReg} installs
          <span className="ml-3 mr-1 inline-block h-2 w-2 rounded-sm bg-emerald-400" /> {totalUnl} unlocks
        </p>
      </div>
      <div className="mt-4 flex h-36 items-end gap-1.5">
        {rows.map((r) => (
          <div
            key={r.day}
            className="flex h-full flex-1 flex-col justify-end"
            title={`${r.day}: ${r.registered} installs, ${r.unlocked} unlocks`}
          >
            <div className="flex h-full items-end justify-center gap-0.5">
              <div className="w-1/2 rounded-t bg-sky-400/80" style={{height: `${(r.registered / peak) * 100}%`}} />
              <div className="w-1/2 rounded-t bg-emerald-400/80" style={{height: `${(r.unlocked / peak) * 100}%`}} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5 text-[10px] text-slate-500">
        {rows.map((r, i) => (
          <span key={r.day} className="flex-1 text-center">
            {i % 2 === 0 ? r.day.slice(5) : ""}
          </span>
        ))}
      </div>
    </section>
  );
}

/** One row per buyer: the store order, when it was bought, and the install
 * that holds it now (a reinstall + «restore purchase» moves it). */
function PurchasesSection({rows}: {rows: Purchase[]}) {
  return (
    <section className="glass-card mt-8 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-sky-200">Purchases</h2>
        <p className="text-xs text-slate-400">One-time unlock, verified with the store.</p>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              <th className="py-2 pr-3">Order</th>
              <th className="py-2 pr-3">Bought</th>
              <th className="py-2 pr-3">Current device</th>
              <th className="py-2 pr-3">Last seen</th>
              <th className="py-2">Restores</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-slate-500">
                  No purchases yet.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={`${p.platform}:${p.transactionId}`} className="border-b border-slate-800/80 align-top">
                  <td className="py-2 pr-3">
                    <span className="font-mono text-slate-100" title={p.transactionId}>
                      {p.transactionId.length > 28 ? `${p.transactionId.slice(0, 28)}…` : p.transactionId}
                    </span>
                    <div className="text-xs text-slate-500">
                      {p.platform} · {p.productId} {p.verified ? "· verified" : ""}
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-slate-300">{fmtDate(p.createdAt)}</td>
                  <td className="py-2 pr-3 text-slate-300">
                    <span className="font-mono" title={p.deviceId}>
                      {shortId(p.deviceId)}
                    </span>
                    <div className="text-xs text-slate-500">
                      {[p.deviceLocale, p.deviceAppVersion].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-slate-300">{ago(p.deviceLastSeenAt)}</td>
                  <td className="py-2 text-slate-300">
                    {p.restores}
                    {p.restoredAt ? <div className="text-xs text-slate-500">last {fmtDate(p.restoredAt)}</div> : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
