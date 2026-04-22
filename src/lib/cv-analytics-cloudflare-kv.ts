const CF_API = "https://api.cloudflare.com/client/v4";

const KEY_TOTAL = "cv_site_total_v1";
const KEY_REFHOSTS = "cv_site_refhosts_json_v1";
const KEY_RECENT = "cv_site_recent_json_v1";

export type CfKvConfig = {
  accountId: string;
  namespaceId: string;
  token: string;
};

export function getCfKvConfig(): CfKvConfig | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID?.trim();
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!accountId || !namespaceId || !token) return null;
  return {accountId, namespaceId, token};
}

function valuesUrl(cfg: CfKvConfig, key: string): string {
  return `${CF_API}/accounts/${cfg.accountId}/storage/kv/namespaces/${cfg.namespaceId}/values/${encodeURIComponent(key)}`;
}

async function kvGetText(cfg: CfKvConfig, key: string): Promise<string | null> {
  const res = await fetch(valuesUrl(cfg, key), {
    headers: {Authorization: `Bearer ${cfg.token}`},
    cache: "no-store"
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Cloudflare KV GET ${key}: ${res.status} ${err.slice(0, 200)}`);
  }
  return res.text();
}

async function kvPutText(cfg: CfKvConfig, key: string, value: string): Promise<void> {
  const res = await fetch(valuesUrl(cfg, key), {
    method: "PUT",
    headers: {Authorization: `Bearer ${cfg.token}`, "Content-Type": "text/plain; charset=utf-8"},
    body: value,
    cache: "no-store"
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Cloudflare KV PUT ${key}: ${res.status} ${err.slice(0, 200)}`);
  }
}

export async function cfKvRecordView(
  cfg: CfKvConfig,
  row: {t: number; path: string; locale: string; referrer: string; refHost: string; ua: string}
): Promise<void> {
  const totalStr = await kvGetText(cfg, KEY_TOTAL);
  const total = Math.max(0, Math.floor(Number(totalStr || 0))) + 1;
  await kvPutText(cfg, KEY_TOTAL, String(total));

  const refStr = await kvGetText(cfg, KEY_REFHOSTS);
  let refMap: Record<string, number> = {};
  if (refStr) {
    try {
      refMap = JSON.parse(refStr) as Record<string, number>;
    } catch {
      refMap = {};
    }
  }
  refMap[row.refHost] = (refMap[row.refHost] ?? 0) + 1;
  await kvPutText(cfg, KEY_REFHOSTS, JSON.stringify(refMap));

  const recentStr = await kvGetText(cfg, KEY_RECENT);
  let recent: string[] = [];
  if (recentStr) {
    try {
      const parsed = JSON.parse(recentStr) as unknown;
      if (Array.isArray(parsed)) recent = parsed.filter((x) => typeof x === "string") as string[];
    } catch {
      recent = [];
    }
  }
  recent.unshift(JSON.stringify(row));
  if (recent.length > 500) recent = recent.slice(0, 500);
  await kvPutText(cfg, KEY_RECENT, JSON.stringify(recent));
}

export async function cfKvGetStats(cfg: CfKvConfig): Promise<{
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
}> {
  const totalStr = await kvGetText(cfg, KEY_TOTAL);
  const totalViews = Math.max(0, Math.floor(Number(totalStr || 0)));

  const refStr = await kvGetText(cfg, KEY_REFHOSTS);
  let refMap: Record<string, number> = {};
  if (refStr) {
    try {
      refMap = JSON.parse(refStr) as Record<string, number>;
    } catch {
      refMap = {};
    }
  }
  const byRefHost = Object.entries(refMap)
    .map(([host, count]) => ({host, count: Number(count) || 0}))
    .sort((a, b) => b.count - a.count);

  const recentStr = await kvGetText(cfg, KEY_RECENT);
  let lines: string[] = [];
  if (recentStr) {
    try {
      const parsed = JSON.parse(recentStr) as unknown;
      if (Array.isArray(parsed)) lines = parsed.filter((x) => typeof x === "string") as string[];
    } catch {
      lines = [];
    }
  }
  const recent = lines.slice(0, 100).map((line) => {
    try {
      return JSON.parse(line) as {
        t: number;
        path: string;
        locale: string;
        referrer: string;
        refHost: string;
        ua: string;
      };
    } catch {
      return {t: 0, path: "", locale: "", referrer: "", refHost: "", ua: ""};
    }
  });

  return {totalViews, byRefHost, recent};
}
