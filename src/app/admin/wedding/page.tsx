"use client";

import Link from "next/link";
import {FormEvent, useCallback, useEffect, useState} from "react";
import {WeddingConfig, WeddingRsvp, defaultWeddingConfig} from "@/lib/wedding-config";

type LocalizedKey = {
  [K in keyof WeddingConfig]-?: WeddingConfig[K] extends {en: string; ar: string} ? K : never;
}[keyof WeddingConfig];

const localizedFields: {key: LocalizedKey; label: string}[] = [
  {key: "groom", label: "Groom"},
  {key: "bride", label: "Bride"},
  {key: "dateLabel", label: "Date label"},
  {key: "timeLabel", label: "Time label"},
  {key: "venue", label: "Venue"},
  {key: "city", label: "City"},
  {key: "occasion", label: "Occasion"},
];

export default function WeddingAdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [config, setConfig] = useState<WeddingConfig>(defaultWeddingConfig);
  const [rsvps, setRsvps] = useState<WeddingRsvp[]>([]);
  const [stats, setStats] = useState({total: 0, yes: 0, no: 0});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/wedding", {credentials: "include"});
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        config?: WeddingConfig;
        rsvps?: WeddingRsvp[];
        stats?: {total: number; yes: number; no: number};
      };
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      if (!res.ok || !json.ok || !json.config) {
        setError(json.error || "Failed to load wedding admin");
        return;
      }
      setAuthed(true);
      setConfig(json.config);
      setRsvps(json.rsvps || []);
      setStats(json.stats || {total: 0, yes: 0, no: 0});
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify({password}),
      });
      const json = (await res.json()) as {ok?: boolean; error?: string; hint?: string};
      if (!res.ok) {
        if (json.error === "admin_not_configured") {
          setError(json.hint || "Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET in .env.local");
        } else {
          setError(json.error === "unauthorized" ? "Wrong password" : json.error || "Login failed");
        }
        return;
      }
      setPassword("");
      await load();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", {method: "POST", credentials: "include"});
    setAuthed(false);
  }

  async function saveConfig(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setOkMsg(null);
    try {
      const res = await fetch("/api/admin/wedding", {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify({config}),
      });
      const json = (await res.json()) as {ok?: boolean; error?: string; config?: WeddingConfig};
      if (!res.ok || !json.ok || !json.config) {
        setError(json.error || "Save failed");
        return;
      }
      setConfig(json.config);
      setOkMsg("Saved. Open /wedding to preview.");
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function uploadMedia(kind: "video" | "poster", file: File | null) {
    if (!file) return;
    setSaving(true);
    setError(null);
    setOkMsg(null);
    try {
      const form = new FormData();
      form.set("kind", kind);
      form.set("file", file);
      const res = await fetch("/api/admin/wedding/media", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const json = (await res.json()) as {ok?: boolean; error?: string; config?: WeddingConfig};
      if (!res.ok || !json.ok || !json.config) {
        setError(json.error || "Upload failed");
        return;
      }
      setConfig(json.config);
      setOkMsg(`${kind === "video" ? "Video" : "Poster"} uploaded.`);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  function setLocalized(key: LocalizedKey, lang: "en" | "ar", value: string) {
    setConfig((prev) => ({
      ...prev,
      [key]: {...prev[key], [lang]: value},
    }));
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admin</p>
            <h1 className="mt-1 text-2xl font-semibold text-sky-200">Wedding invitation</h1>
            <p className="mt-2 text-sm text-slate-400">
              Edit names, venue, media, WhatsApp — and review RSVPs.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/admin" className="rounded-md border border-slate-700 px-3 py-1.5 hover:border-sky-400">
              CV analytics
            </Link>
            <Link
              href="/wedding"
              target="_blank"
              className="rounded-md border border-slate-700 px-3 py-1.5 hover:border-emerald-400"
            >
              Open invite
            </Link>
          </div>
        </div>

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
              className="w-full rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-60"
            >
              {loading ? "…" : "Log in"}
            </button>
          </form>
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void load()}
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
        {okMsg ? <p className="mt-4 text-sm text-emerald-300">{okMsg}</p> : null}

        {authed ? (
          <div className="mt-8 space-y-8">
            <section className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">RSVPs</p>
                <p className="mt-1 text-3xl font-semibold">{stats.total}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Attending</p>
                <p className="mt-1 text-3xl font-semibold text-emerald-300">{stats.yes}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Not attending</p>
                <p className="mt-1 text-3xl font-semibold text-rose-300">{stats.no}</p>
              </div>
            </section>

            <form onSubmit={saveConfig} className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <h2 className="text-lg font-semibold text-sky-200">Invitation details</h2>

              <div className="grid gap-4 md:grid-cols-2">
                {localizedFields.map((field) => (
                  <div key={field.key} className="space-y-2 rounded-lg border border-slate-800 p-3">
                    <p className="text-sm font-medium text-slate-200">{field.label}</p>
                    <label className="grid gap-1 text-xs text-slate-400">
                      EN
                      <input
                        value={config[field.key].en}
                        onChange={(e) => setLocalized(field.key, "en", e.target.value)}
                        className="rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100"
                      />
                    </label>
                    <label className="grid gap-1 text-xs text-slate-400">
                      AR
                      <input
                        dir="rtl"
                        value={config[field.key].ar}
                        onChange={(e) => setLocalized(field.key, "ar", e.target.value)}
                        className="rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100"
                      />
                    </label>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  <span>Datetime (countdown / calendar)</span>
                  <input
                    type="datetime-local"
                    value={config.datetime.slice(0, 16)}
                    onChange={(e) => setConfig((prev) => ({...prev, datetime: e.target.value}))}
                    className="rounded-md border border-slate-700 bg-slate-950 p-2"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span>WhatsApp (digits only)</span>
                  <input
                    value={config.whatsapp}
                    onChange={(e) => setConfig((prev) => ({...prev, whatsapp: e.target.value}))}
                    className="rounded-md border border-slate-700 bg-slate-950 p-2"
                    placeholder="2010xxxxxxxx"
                  />
                </label>
                <label className="grid gap-1 text-sm md:col-span-2">
                  <span>Google Maps URL</span>
                  <input
                    value={config.mapsUrl}
                    onChange={(e) => setConfig((prev) => ({...prev, mapsUrl: e.target.value}))}
                    className="rounded-md border border-slate-700 bg-slate-950 p-2"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-800 p-3">
                  <p className="text-sm font-medium">Hero video</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{config.video}</p>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    className="mt-3 block w-full text-xs"
                    onChange={(e) => void uploadMedia("video", e.target.files?.[0] || null)}
                  />
                </div>
                <div className="rounded-lg border border-slate-800 p-3">
                  <p className="text-sm font-medium">Poster image</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{config.poster}</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="mt-3 block w-full text-xs"
                    onChange={(e) => void uploadMedia("poster", e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save invitation"}
              </button>
            </form>

            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <h2 className="mb-4 text-lg font-semibold text-sky-200">RSVP inbox</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="py-2 pr-3">Time</th>
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Lang</th>
                      <th className="py-2 pr-3">Message</th>
                      <th className="py-2">Signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rsvps.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-slate-500">
                          No RSVPs yet.
                        </td>
                      </tr>
                    ) : (
                      rsvps.map((row) => (
                        <tr key={row.id} className="border-b border-slate-800/80 align-top">
                          <td className="py-2 pr-3 whitespace-nowrap text-slate-400">
                            {new Date(row.createdAt).toLocaleString()}
                          </td>
                          <td className="py-2 pr-3 font-medium text-slate-100">{row.name}</td>
                          <td className="py-2 pr-3">
                            <span
                              className={
                                row.attending === "yes" ? "text-emerald-300" : "text-rose-300"
                              }
                            >
                              {row.attending === "yes" ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="py-2 pr-3 font-mono text-slate-400">{row.lang}</td>
                          <td className="max-w-xs py-2 pr-3 whitespace-pre-wrap text-slate-300">
                            {row.message || "—"}
                          </td>
                          <td className="py-2">
                            {row.signature ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={row.signature}
                                alt={`Signature of ${row.name}`}
                                className="h-12 w-28 rounded border border-slate-700 bg-white object-contain"
                              />
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
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
