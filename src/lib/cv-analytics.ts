import {d1GetStats, d1RecordView, getCfD1Config} from "@/lib/cv-analytics-d1";

function useMemoryStore(): boolean {
  return process.env.NODE_ENV === "development" && process.env.CV_ANALYTICS_MEMORY === "1";
}

let memTotal = 0;
const memRefHost = new Map<string, number>();
const memRecent: string[] = [];
let lastD1Error: string | null = null;

function parseRefHost(landingReferrer: string | null | undefined): string {
  if (!landingReferrer) return "(direct / no referrer)";
  try {
    const host = new URL(landingReferrer).hostname;
    return host || "(unknown)";
  } catch {
    return "(invalid referrer)";
  }
}

function safeRefHostField(host: string): string {
  const trimmed = host.trim().slice(0, 200);
  return trimmed || "(unknown)";
}

function detectSourceFromUserAgent(ua: string): string | null {
  const s = ua.toLowerCase();
  if (s.includes("telegram")) return "telegram";
  if (s.includes("whatsapp")) return "whatsapp";
  if (s.includes("instagram")) return "instagram";
  if (s.includes("fbav") || s.includes("fban") || s.includes("facebook")) return "facebook";
  if (s.includes("tiktok")) return "tiktok";
  if (s.includes("linkedin")) return "linkedin";
  return null;
}

function detectPlatformFromUserAgent(ua: string): string {
  const s = ua.toLowerCase();
  if (s.includes("android")) return "android";
  if (s.includes("iphone") || s.includes("ipad") || s.includes("ios")) return "ios";
  if (s.includes("windows")) return "windows";
  if (s.includes("macintosh") || s.includes("mac os")) return "macos";
  if (s.includes("linux")) return "linux";
  return "unknown";
}

export function isCvAnalyticsConfigured(): boolean {
  return useMemoryStore() || getCfD1Config() !== null;
}

/** Safe booleans for /admin — shows which env vars the server sees (no values). */
export function getAnalyticsDiagnostics() {
  return {
    nodeEnv: process.env.NODE_ENV ?? "",
    memoryDev: useMemoryStore(),
    d1: {
      CLOUDFLARE_ACCOUNT_ID: Boolean(process.env.CLOUDFLARE_ACCOUNT_ID?.trim()),
      CLOUDFLARE_D1_DATABASE_ID: Boolean(process.env.CLOUDFLARE_D1_DATABASE_ID?.trim()),
      CLOUDFLARE_API_TOKEN: Boolean(process.env.CLOUDFLARE_API_TOKEN?.trim()),
      ready: getCfD1Config() !== null,
      lastError: lastD1Error
    }
  };
}

export async function recordCvView(input: {
  path: string;
  locale?: string;
  landingReferrer: string | null;
  userAgent?: string | null;
  country?: string | null;
}): Promise<{ok: boolean; reason?: string}> {
  const refHost = safeRefHostField(parseRefHost(input.landingReferrer));
  const ua = (input.userAgent ?? "").slice(0, 400);
  const appSource = detectSourceFromUserAgent(ua);
  const source = appSource ?? refHost;
  const platform = detectPlatformFromUserAgent(ua);
  const country = (input.country ?? "").trim().slice(0, 3).toUpperCase() || "ZZ";
  const row = {
    t: Date.now(),
    path: input.path,
    locale: input.locale ?? "",
    referrer: input.landingReferrer ?? "",
    refHost,
    source,
    platform,
    country,
    ua
  };

  if (useMemoryStore()) {
    const payload = JSON.stringify(row);
    memTotal += 1;
    memRefHost.set(refHost, (memRefHost.get(refHost) ?? 0) + 1);
    memRecent.unshift(payload);
    if (memRecent.length > 500) memRecent.length = 500;
    return {ok: true};
  }

  const d1 = getCfD1Config();
  if (!d1) return {ok: false, reason: "d1_not_configured"};
  try {
    const id = globalThis.crypto.randomUUID();
    await d1RecordView(d1, {
      id,
      t: row.t,
      path: row.path,
      locale: row.locale,
      referrer: row.referrer,
      refHost: row.refHost,
        source: row.source,
        platform: row.platform,
        country: row.country,
      ua: row.ua
    });
    lastD1Error = null;
    return {ok: true};
  } catch (error) {
    lastD1Error = error instanceof Error ? error.message.slice(0, 300) : "Unknown D1 error";
    return {ok: false, reason: "cloudflare_d1_failed"};
  }
}

export type CvStats = {
  totalViews: number;
  bySource: {source: string; count: number}[];
  recent: {
    t: number;
    path: string;
    locale: string;
    referrer: string;
    refHost: string;
    source: string;
    platform: string;
    country: string;
    ua: string;
  }[];
};

function buildMemoryStats(): CvStats {
  const bySourceMap = new Map<string, number>();
  for (const [host, count] of memRefHost.entries()) bySourceMap.set(host, count);
  const bySource = [...bySourceMap.entries()]
    .map(([source, count]) => ({source, count}))
    .sort((a, b) => b.count - a.count);
  const recent = memRecent.slice(0, 100).map((line) => {
    try {
      return JSON.parse(line) as CvStats["recent"][number];
    } catch {
      return {t: 0, path: "", locale: "", referrer: "", refHost: "", source: "", platform: "", country: "", ua: ""};
    }
  });
  return {totalViews: memTotal, bySource, recent};
}

export async function getCvStats(): Promise<CvStats | null> {
  if (useMemoryStore()) {
    return buildMemoryStats();
  }
  const d1 = getCfD1Config();
  if (!d1) return null;
  try {
    const stats = await d1GetStats(d1);
    lastD1Error = null;
    return stats;
  } catch (error) {
    lastD1Error = error instanceof Error ? error.message.slice(0, 300) : "Unknown D1 error";
    return {totalViews: 0, bySource: [], recent: []};
  }
}
