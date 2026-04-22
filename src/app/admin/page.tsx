"use client";

import {useCallback, useEffect, useState} from "react";

type RefRow = {host: string; count: number};
type RecentRow = {t: number; path: string; locale: string; referrer: string; refHost: string; ua: string};

type StatsPayload = {
  ok: boolean;
  configured?: boolean;
  stats: null | {
    totalViews: number;
    byRefHost: RefRow[];
    recent: RecentRow[];
  };
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

        {authed && data?.configured === false ? (
          <div className="mt-8 space-y-6 rounded-xl border border-amber-800/80 bg-amber-950/40 p-4 text-sm text-amber-100">
            <p className="font-medium">Analytics storage not configured</p>
            <p className="text-amber-200/90">
              Pick <strong>one</strong> backend. Set variables in <code className="rounded bg-slate-900 px-1">.env.local</code>{" "}
              or in <strong>Cloudflare Pages → Settings → Variables</strong>, then restart / redeploy.
            </p>

            <div>
              <p className="font-medium text-sky-200">Option A — Cloudflare D1 (SQLite, good for analytics)</p>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-amber-200/95">
                <li>
                  <strong>Workers &amp; Pages</strong> → <strong>D1</strong> → open your database (e.g.{" "}
                  <code className="rounded bg-slate-900 px-1">d1-template-database</code> is only the label).
                </li>
                <li>
                  Copy the <strong>Database ID</strong> (UUID) → <code className="rounded bg-slate-900 px-1">CLOUDFLARE_D1_DATABASE_ID</code>.
                </li>
                <li>
                  <strong>Overview</strong> → <strong>Account ID</strong> → <code className="rounded bg-slate-900 px-1">CLOUDFLARE_ACCOUNT_ID</code>.
                </li>
                <li>
                  <strong>API Tokens</strong> → include <strong>Account D1 → Edit</strong> (and read) →{" "}
                  <code className="rounded bg-slate-900 px-1">CLOUDFLARE_API_TOKEN</code>. The app creates the{" "}
                  <code className="rounded bg-slate-900 px-1">cv_views</code> table automatically on first write.
                </li>
              </ol>
            </div>

            <div>
              <p className="font-medium text-sky-200">Option B — Cloudflare KV (key-value)</p>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-amber-200/95">
                <li>
                  <strong>KV</strong> → create namespace → <code className="rounded bg-slate-900 px-1">CLOUDFLARE_KV_NAMESPACE_ID</code> + same{" "}
                  <code className="rounded bg-slate-900 px-1">CLOUDFLARE_ACCOUNT_ID</code> / <code className="rounded bg-slate-900 px-1">CLOUDFLARE_API_TOKEN</code>{" "}
                  (token needs <strong>Workers KV Storage → Edit</strong>). Used only if D1 is <em>not</em> set.
                </li>
              </ol>
            </div>

            <div>
              <p className="font-medium text-sky-200">Option C — Upstash Redis (external)</p>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-amber-200/95">
                <li>
                  <a href="https://console.upstash.com/" target="_blank" rel="noreferrer" className="text-sky-300 underline hover:text-sky-200">
                    Upstash
                  </a>{" "}
                  → Redis → REST API → <code className="rounded bg-slate-900 px-1">UPSTASH_REDIS_REST_URL</code> +{" "}
                  <code className="rounded bg-slate-900 px-1">UPSTASH_REDIS_REST_TOKEN</code>.
                </li>
              </ol>
            </div>

            <p className="text-amber-200/85">
              Until then, <code className="rounded bg-slate-900 px-1">POST /api/cv/track</code> returns 503.
            </p>
            <p className="text-slate-300">
              <strong>Local only:</strong> <code className="rounded bg-slate-900 px-1">CV_ANALYTICS_MEMORY=1</code> in{" "}
              <code className="rounded bg-slate-900 px-1">.env.local</code> (dev) — RAM only, resets on server restart.
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
