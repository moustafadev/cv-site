import {promises as fs} from "node:fs";
import path from "node:path";
import {
  WeddingConfig,
  WeddingRsvp,
  defaultWeddingConfig,
} from "@/lib/wedding-config";

const dataDir = path.join(process.cwd(), "data");
const configPath = path.join(dataDir, "wedding.json");
const rsvpsPath = path.join(dataDir, "wedding-rsvps.json");

function isLocalized(value: unknown): value is {en: string; ar: string} {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as {en?: unknown}).en === "string" &&
    typeof (value as {ar?: unknown}).ar === "string"
  );
}

export function normalizeWeddingConfig(input: unknown): WeddingConfig {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Partial<WeddingConfig>;
  const pickLocalized = (value: unknown, fallback: {en: string; ar: string}) =>
    isLocalized(value) ? {en: value.en.trim() || fallback.en, ar: value.ar.trim() || fallback.ar} : fallback;

  return {
    groom: pickLocalized(raw.groom, defaultWeddingConfig.groom),
    bride: pickLocalized(raw.bride, defaultWeddingConfig.bride),
    datetime:
      typeof raw.datetime === "string" && raw.datetime.trim()
        ? raw.datetime.trim()
        : defaultWeddingConfig.datetime,
    dateLabel: pickLocalized(raw.dateLabel, defaultWeddingConfig.dateLabel),
    timeLabel: pickLocalized(raw.timeLabel, defaultWeddingConfig.timeLabel),
    venue: pickLocalized(raw.venue, defaultWeddingConfig.venue),
    city: pickLocalized(raw.city, defaultWeddingConfig.city),
    mapsUrl:
      typeof raw.mapsUrl === "string" && raw.mapsUrl.trim()
        ? raw.mapsUrl.trim()
        : defaultWeddingConfig.mapsUrl,
    whatsapp:
      typeof raw.whatsapp === "string"
        ? raw.whatsapp.replace(/\D/g, "") || defaultWeddingConfig.whatsapp
        : defaultWeddingConfig.whatsapp,
    video:
      typeof raw.video === "string" && raw.video.trim()
        ? raw.video.trim()
        : defaultWeddingConfig.video,
    poster:
      typeof raw.poster === "string" && raw.poster.trim()
        ? raw.poster.trim()
        : defaultWeddingConfig.poster,
    occasion: pickLocalized(raw.occasion, defaultWeddingConfig.occasion),
  };
}

async function ensureDataDir() {
  await fs.mkdir(dataDir, {recursive: true});
}

export async function readWeddingConfig(): Promise<WeddingConfig> {
  try {
    const raw = await fs.readFile(configPath, "utf8");
    return normalizeWeddingConfig(JSON.parse(raw));
  } catch {
    return defaultWeddingConfig;
  }
}

export async function writeWeddingConfig(config: WeddingConfig): Promise<WeddingConfig> {
  const normalized = normalizeWeddingConfig(config);
  await ensureDataDir();
  await fs.writeFile(configPath, JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
}

export async function readWeddingRsvps(): Promise<WeddingRsvp[]> {
  try {
    const raw = await fs.readFile(rsvpsPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row): row is WeddingRsvp => {
      return (
        typeof row === "object" &&
        row !== null &&
        typeof (row as WeddingRsvp).id === "string" &&
        typeof (row as WeddingRsvp).name === "string" &&
        ((row as WeddingRsvp).attending === "yes" || (row as WeddingRsvp).attending === "no")
      );
    });
  } catch {
    return [];
  }
}

export async function addWeddingRsvp(
  input: Omit<WeddingRsvp, "id" | "createdAt">
): Promise<WeddingRsvp> {
  const rows = await readWeddingRsvps();
  const row: WeddingRsvp = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    name: input.name.trim().slice(0, 120),
    attending: input.attending,
    message: input.message.trim().slice(0, 1000),
    signature: input.signature,
    lang: input.lang,
  };
  rows.unshift(row);
  await ensureDataDir();
  await fs.writeFile(rsvpsPath, JSON.stringify(rows.slice(0, 500), null, 2), "utf8");
  return row;
}
