"use client";

import {useCallback, useEffect, useState} from "react";

type Row = {
  t: number;
  path: string;
  locale: string;
  referrer: string;
  refHost: string;
  source: string;
  platform: string;
  country: string;
  ua: string;
};
type Option = {value: string; count: number};
type FacetKey = "source" | "country" | "platform" | "path";
type Options = Record<FacetKey, Option[]>;
type Filters = Record<FacetKey, string> & {range: RangeKey; q: string};
type RangeKey = "all" | "today" | "7d" | "30d";

const RANGES: {key: RangeKey; label: string}[] = [
  {key: "all", label: "All time"},
  {key: "today", label: "Today"},
  {key: "7d", label: "Last 7 days"},
  {key: "30d", label: "Last 30 days"}
];

const FACETS: {key: FacetKey; label: string}[] = [
  {key: "source", label: "Source"},
  {key: "country", label: "Country"},
  {key: "platform", label: "Platform"},
  {key: "path", label: "Page"}
];

const EMPTY: Filters = {source: "", country: "", platform: "", path: "", range: "all", q: ""};

function sinceFor(range: RangeKey): number | null {
  if (range === "today") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (range === "7d") return Date.now() - 7 * 86_400_000;
  if (range === "30d") return Date.now() - 30 * 86_400_000;
  return null;
}

/** Recent visits with server-side filters over the whole cv_views table. `refreshTick` reloads when the page's Refresh runs. */
export function RecentVisits({refreshTick}: {refreshTick: number}) {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [options, setOptions] = useState<Options | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce the free-text search so typing doesn't fire a request per key.
  useEffect(() => {
    const id = window.setTimeout(() => setFilters((f) => (f.q === search.trim() ? f : {...f, q: search.trim()})), 350);
    return () => window.clearTimeout(id);
  }, [search]);

  const fetchPage = useCallback(
    async (offset: number) => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      for (const {key} of FACETS) if (filters[key]) params.set(key, filters[key]);
      const since = sinceFor(filters.range);
      if (since) params.set("since", String(since));
      if (filters.q) params.set("q", filters.q);
      if (offset) params.set("offset", String(offset));
      try {
        const res = await fetch(`/api/admin/visits?${params}`, {credentials: "include"});
        const json = (await res.json()) as {ok: boolean; error?: string; total?: number; rows?: Row[]; options?: Options | null};
        if (!json.ok) {
          setError(json.error ?? "Failed to load visits");
          return;
        }
        setTotal(json.total ?? 0);
        setRows((prev) => (offset ? [...prev, ...(json.rows ?? [])] : json.rows ?? []));
        if (json.options) setOptions(json.options);
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    void fetchPage(0);
  }, [fetchPage, refreshTick]);

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({...f, [key]: value}));
  }

  /** Clicking a value in the table toggles it as a filter. */
  function quickFilter(key: FacetKey, value: string) {
    setFilters((f) => ({...f, [key]: f[key] === value ? "" : value}));
  }

  const active = FACETS.some(({key}) => filters[key]) || filters.range !== "all" || filters.q;
  const select = "rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-slate-200 focus:border-sky-500 focus:outline-none";
  const cellButton = "rounded px-1 -mx-1 text-left transition hover:bg-slate-800 hover:text-sky-200";

  return (
    <section className="glass-card p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-sky-200">Recent visits</h2>
        <span className="text-sm text-slate-400">
          {loading && !rows.length ? "Loading…" : `${total.toLocaleString()} ${active ? "matching" : "total"} visit${total === 1 ? "" : "s"}`}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={filters.range} onChange={(e) => set("range", e.target.value as RangeKey)} className={select} aria-label="Time range">
          {RANGES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
        {FACETS.map(({key, label}) => (
          <select
            key={key}
            value={filters[key]}
            onChange={(e) => set(key, e.target.value)}
            className={`${select} ${key === "path" ? "max-w-[14rem]" : "max-w-[12rem]"} ${filters[key] ? "border-sky-600 text-sky-200" : ""}`}
            aria-label={label}
          >
            <option value="">{label}: all</option>
            {/* Keep a selected value listed even if it isn't in the top options. */}
            {filters[key] && !options?.[key].some((o) => o.value === filters[key]) ? (
              <option value={filters[key]}>{filters[key]}</option>
            ) : null}
            {options?.[key].map((o) => (
              <option key={o.value} value={o.value}>
                {o.value} ({o.count})
              </option>
            ))}
          </select>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search referrer, user agent…"
          className={`${select} min-w-[12rem] flex-1`}
          aria-label="Search"
        />
        {active ? (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFilters(EMPTY);
            }}
            className="rounded-md px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}

      <div className={`overflow-x-auto transition-opacity ${loading && rows.length ? "opacity-60" : ""}`}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              <th className="py-2 pr-3">Time</th>
              <th className="py-2 pr-3">Path</th>
              <th className="py-2 pr-3">Source</th>
              <th className="py-2 pr-3">Country</th>
              <th className="py-2 pr-3">Platform</th>
              <th className="py-2">Referrer</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading ? (
              <tr>
                <td colSpan={6} className="py-4 text-slate-500">
                  {active ? "No visits match these filters." : "No rows yet."}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={`${row.t}-${i}`} className="border-b border-slate-800/80 align-top">
                  <td className="whitespace-nowrap py-2 pr-3 text-slate-400">{row.t ? new Date(row.t).toLocaleString() : "—"}</td>
                  <td className="py-2 pr-3 font-mono text-slate-200">
                    <button type="button" onClick={() => quickFilter("path", row.path)} className={cellButton} title="Filter by this page">
                      {row.path}
                    </button>
                  </td>
                  <td className="py-2 pr-3 font-mono text-slate-300">
                    <button type="button" onClick={() => quickFilter("source", row.source)} className={cellButton} title="Filter by this source">
                      {row.source || "—"}
                    </button>
                  </td>
                  <td className="py-2 pr-3 font-mono text-slate-300">
                    <button type="button" onClick={() => quickFilter("country", row.country)} className={cellButton} title="Filter by this country">
                      {row.country || "ZZ"}
                    </button>
                  </td>
                  <td className="py-2 pr-3 font-mono text-slate-300">
                    <button type="button" onClick={() => quickFilter("platform", row.platform)} className={cellButton} title="Filter by this platform">
                      {row.platform || "unknown"}
                    </button>
                  </td>
                  <td className="max-w-xs truncate py-2 text-slate-500" title={row.referrer}>
                    {row.referrer || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rows.length < total ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            disabled={loading}
            onClick={() => void fetchPage(rows.length)}
            className="rounded-md border border-slate-600 px-4 py-1.5 text-sm hover:border-sky-400 disabled:opacity-60"
          >
            {loading ? "Loading…" : `Load more (${(total - rows.length).toLocaleString()} left)`}
          </button>
        </div>
      ) : null}
    </section>
  );
}
