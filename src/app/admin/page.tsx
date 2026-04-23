"use client";

import {useCallback, useEffect, useState} from "react";

type RefRow = {host: string; count: number};
type RecentRow = {t: number; path: string; locale: string; referrer: string; refHost: string; ua: string};

type AnalyticsDiagnostics = {
  nodeEnv: string;
  memoryDev: boolean;
  d1: {
    CLOUDFLARE_ACCOUNT_ID: boolean;
    CLOUDFLARE_D1_DATABASE_ID: boolean;
    CLOUDFLARE_API_TOKEN: boolean;
    ready: boolean;
    lastError?: string | null;
  };
};

type StatsPayload = {
  ok: boolean;
  configured?: boolean;
  stats: null | {
    totalViews: number;
    byRefHost: RefRow[];
    recent: RecentRow[];
  };
  diagnostics?: AnalyticsDiagnostics;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StatsPayload | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats", {credentials: "include"});
      const json = (await res.json()) as StatsPayload & {error?: string};
      if (res.status === 401) {
        setAuthed(false);
        setData(null);
        return;
      }
      if (!json.ok) {
        setError(json.error || "Failed to load stats");
        return;
      }
      setAuthed(true);
      setData(json);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify({password})
      });
      const json = (await res.json()) as {ok?: boolean; error?: string; hint?: string};
      if (!res.ok) {
        if (json.error === "admin_not_configured") {
          setError(
            json.hint ||
              "Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET in .env.local (non-empty), then restart the dev server."
          );
        } else {
          setError(json.error === "unauthorized" ? "Wrong password" : json.error || "Login failed");
        }
        return;
      }
      setPassword("");
      await loadStats();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", {method: "POST", credentials: "include"});
    setAuthed(false);
    setData(null);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="container-page max-w-4xl">
        <h1 className="text-2xl font-semibold text-brand-100">CV analytics</h1>
        <p className="mt-2 text-sm text-slate-400">
          Total visits and approximate source (referrer when the browser sends it). One counted visit per browser tab
          session.
        </p>

        {!authed ? (
          <form onSubmit={login} className="mt-8 max-w-sm space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <label className="grid gap-1 text-sm">
              <span>Admin password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-md border border-slate-700 bg-slate-950 p-2"
                autoComplete="current-password"
                required
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? "…" : "Log in"}
            </button>
          </form>
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadStats()}
              disabled={loading}
              className="rounded-md border border-slate-600 px-3 py-1.5 text-sm hover:border-sky-400 disabled:opacity-60"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-md border border-slate-600 px-3 py-1.5 text-sm hover:border-rose-400"
            >
              Log out
            </button>
          </div>
        )}

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

        {authed && data?.diagnostics?.d1.lastError ? (
          <div className="mt-4 rounded-lg border border-rose-800/80 bg-rose-950/40 p-3 text-sm text-rose-200">
            <p className="font-medium">D1 error</p>
            <p className="mt-1 font-mono text-xs break-all">{data.diagnostics.d1.lastError}</p>
          </div>
        ) : null}

        {authed && data?.configured === false ? (
          <div className="mt-8 space-y-6 rounded-xl border border-amber-800/80 bg-amber-950/40 p-4 text-sm text-amber-100">
            <p className="font-medium">Analytics storage not configured (D1)</p>
            <p className="text-amber-200/90">
              Set the three Cloudflare variables in <code className="rounded bg-slate-900 px-1">.env.local</code> or{" "}
              <strong>Cloudflare Pages → Settings → Environment variables</strong> (Production), then restart locally or{" "}
              <strong>redeploy</strong>. Names must match exactly (case-sensitive).
            </p>

            {data.diagnostics ? (
              <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-slate-200">
                <p className="mb-2 font-medium text-slate-100">What the server sees (no secret values)</p>
                <p className="mb-2 text-xs text-slate-500">
                  NODE_ENV: <code className="text-slate-400">{data.diagnostics.nodeEnv || "—"}</code>
                </p>
                <ul className="space-y-0.5 font-mono text-xs">
                  <li>CLOUDFLARE_ACCOUNT_ID: {data.diagnostics.d1.CLOUDFLARE_ACCOUNT_ID ? "✓" : "✗"}</li>
                  <li>CLOUDFLARE_D1_DATABASE_ID: {data.diagnostics.d1.CLOUDFLARE_D1_DATABASE_ID ? "✓" : "✗"}</li>
                  <li>CLOUDFLARE_API_TOKEN: {data.diagnostics.d1.CLOUDFLARE_API_TOKEN ? "✓" : "✗"}</li>
                  <li className="text-slate-400">D1 ready: {data.diagnostics.d1.ready ? "yes" : "no"}</li>
                  <li className="text-slate-400">D1 last error: {data.diagnostics.d1.lastError || "none"}</li>
                </ul>
                <p className="mt-2 text-xs text-slate-500">
                  Dev RAM mode: {data.diagnostics.memoryDev ? "on" : "off"} (<code className="text-slate-400">CV_ANALYTICS_MEMORY=1</code> + dev only)
                </p>
              </div>
            ) : null}

            <div>
              <p className="font-medium text-sky-200">Cloudflare D1</p>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-amber-200/95">
                <li>
                  <strong>Workers &amp; Pages</strong> → <strong>D1</strong> → open your database (the label is not the ID).
                </li>
                <li>
                  <strong>Database ID</strong> (UUID) → <code className="rounded bg-slate-900 px-1">CLOUDFLARE_D1_DATABASE_ID</code>.
                </li>
                <li>
                  <strong>Account ID</strong> → <code className="rounded bg-slate-900 px-1">CLOUDFLARE_ACCOUNT_ID</code>.
                </li>
                <li>
                  API token with <strong>Account → D1 → Edit</strong> → <code className="rounded bg-slate-900 px-1">CLOUDFLARE_API_TOKEN</code>. Table{" "}
                  <code className="rounded bg-slate-900 px-1">cv_views</code> is created on first successful write.
                </li>
              </ol>
            </div>

            <p className="text-amber-200/85">
              Until D1 is ready, <code className="rounded bg-slate-900 px-1">POST /api/cv/track</code> returns 503.
            </p>
            <p className="text-slate-300">
              <strong>Local only:</strong> <code className="rounded bg-slate-900 px-1">CV_ANALYTICS_MEMORY=1</code> in{" "}
              <code className="rounded bg-slate-900 px-1">.env.local</code> (dev) — RAM only, resets when the dev server restarts.
            </p>
          </div>
        ) : null}

        {authed && data?.configured && data.stats ? (
          <div className="mt-10 space-y-10">
            <section className="glass-card p-5">
              <h2 className="text-lg font-semibold text-sky-200">Total views (sessions)</h2>
              <p className="mt-2 text-4xl font-bold text-slate-50">{data.stats.totalViews}</p>
            </section>

            <section className="glass-card p-5">
              <h2 className="mb-4 text-lg font-semibold text-sky-200">By source (hostname)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="py-2 pr-4">Source</th>
                      <th className="py-2">Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.stats.byRefHost.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="py-4 text-slate-500">
                          No data yet.
                        </td>
                      </tr>
                    ) : (
                      data.stats.byRefHost.map((row) => (
                        <tr key={row.host} className="border-b border-slate-800/80">
                          <td className="py-2 pr-4 font-mono text-slate-200">{row.host}</td>
                          <td className="py-2">{row.count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="glass-card p-5">
              <h2 className="mb-4 text-lg font-semibold text-sky-200">Recent visits</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="py-2 pr-3">Time</th>
                      <th className="py-2 pr-3">Path</th>
                      <th className="py-2 pr-3">Source</th>
                      <th className="py-2">Referrer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.stats.recent.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-slate-500">
                          No rows yet.
                        </td>
                      </tr>
                    ) : (
                      data.stats.recent.map((row, i) => (
                        <tr key={`${row.t}-${i}`} className="border-b border-slate-800/80 align-top">
                          <td className="py-2 pr-3 whitespace-nowrap text-slate-400">
                            {row.t ? new Date(row.t).toLocaleString() : "—"}
                          </td>
                          <td className="py-2 pr-3 font-mono text-slate-200">{row.path}</td>
                          <td className="py-2 pr-3 font-mono text-slate-300">{row.refHost}</td>
                          <td className="max-w-xs truncate py-2 text-slate-500" title={row.referrer}>
                            {row.referrer || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
