import {d1GetStats, d1RecordView, getCfD1Config} from "@/lib/cv-analytics-d1";
import {cfKvGetStats, cfKvRecordView, getCfKvConfig} from "@/lib/cv-analytics-cloudflare-kv";
import {redis} from "@/lib/redis";

const TOTAL_KEY = "cv:total_views";
const REFHOST_KEY = "cv:refhost_count";
const RECENT_KEY = "cv:recent";

function useMemoryStore(): boolean {
  return process.env.NODE_ENV === "development" && process.env.CV_ANALYTICS_MEMORY === "1";
}

let memTotal = 0;
const memRefHost = new Map<string, number>();
const memRecent: string[] = [];

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

export function isCvAnalyticsConfigured(): boolean {
  return useMemoryStore() || getCfD1Config() !== null || getCfKvConfig() !== null || redis !== null;
}

export async function recordCvView(input: {
  path: string;
  locale?: string;
  landingReferrer: string | null;
  userAgent?: string | null;
}): Promise<{ok: boolean; reason?: string}> {
  const refHost = safeRefHostField(parseRefHost(input.landingReferrer));
  const row = {
    t: Date.now(),
    path: input.path,
    locale: input.locale ?? "",
    referrer: input.landingReferrer ?? "",
    refHost,
    ua: (input.userAgent ?? "").slice(0, 400)
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
  if (d1) {
    try {
      const id = globalThis.crypto.randomUUID();
      await d1RecordView(d1, {
        id,
        t: row.t,
        path: row.path,
        locale: row.locale,
        referrer: row.referrer,
        refHost: row.refHost,
        ua: row.ua
      });
      return {ok: true};
    } catch {
      return {ok: false, reason: "cloudflare_d1_failed"};
    }
  }

  const cf = getCfKvConfig();
  if (cf) {
    try {
      await cfKvRecordView(cf, row);
      return {ok: true};
    } catch {
      return {ok: false, reason: "cloudflare_kv_failed"};
    }
  }

  if (!redis) return {ok: false, reason: "analytics_not_configured"};
  const payload = JSON.stringify(row);
  await redis.incr(TOTAL_KEY);
  await redis.hincrby(REFHOST_KEY, refHost, 1);
  await redis.lpush(RECENT_KEY, payload);
  await redis.ltrim(RECENT_KEY, 0, 499);
  return {ok: true};
}

export type CvStats = {
  totalViews: number;
  byRefHost: {host: string; count: number}[];
  recent: {
    t: number;
    path: string;
    locale: string;
    referrer: string;
    refHost: string;
    ua: string;
  }[];
};

function buildMemoryStats(): CvStats {
  const byRefHost = [...memRefHost.entries()]
    .map(([host, count]) => ({host, count}))
    .sort((a, b) => b.count - a.count);
  const recent = memRecent.slice(0, 100).map((line) => {
    try {
      return JSON.parse(line) as CvStats["recent"][number];
    } catch {
      return {t: 0, path: "", locale: "", referrer: "", refHost: "", ua: ""};
    }
  });
  return {totalViews: memTotal, byRefHost, recent};
}

export async function getCvStats(): Promise<CvStats | null> {
  if (useMemoryStore()) {
    return buildMemoryStats();
  }
  const d1 = getCfD1Config();
  if (d1) {
    try {
      return await d1GetStats(d1);
    } catch {
      return {totalViews: 0, byRefHost: [], recent: []};
    }
  }
  const cf = getCfKvConfig();
  if (cf) {
    try {
      return await cfKvGetStats(cf);
    } catch {
      return {totalViews: 0, byRefHost: [], recent: []};
    }
  }
  if (!redis) return null;
  const totalRaw = await redis.get<string | number>(TOTAL_KEY);
  const totalViews = typeof totalRaw === "number" ? totalRaw : Number(totalRaw || 0);
  const rawMap = await redis.hgetall<Record<string, string>>(REFHOST_KEY);
  const byRefHost = Object.entries(rawMap || {})
    .map(([host, count]) => ({host, count: Number(count) || 0}))
    .sort((a, b) => b.count - a.count);
  const recentRaw = await redis.lrange(RECENT_KEY, 0, 99);
  const recent = recentRaw.map((line) => {
    try {
      return JSON.parse(line) as CvStats["recent"][number];
    } catch {
      return {t: 0, path: "", locale: "", referrer: "", refHost: "", ua: ""};
    }
  });
  return {totalViews, byRefHost, recent};
}
