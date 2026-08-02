import {promises as fs} from "node:fs";
import path from "node:path";
import {getCfD1Config} from "@/lib/cv-analytics-d1";
import {
  WeddingConfig,
  WeddingRsvp,
  defaultWeddingConfig,
  normalizeWeddingConfig,
} from "@/lib/wedding-config";
import {
  d1AddWeddingRsvp,
  d1ReadWeddingConfig,
  d1ReadWeddingRsvps,
  d1WriteWeddingConfig,
  hasWeddingD1,
} from "@/lib/wedding-d1";

export {normalizeWeddingConfig} from "@/lib/wedding-config";

const dataDir = path.join(process.cwd(), "data");
const configPath = path.join(dataDir, "wedding.json");
const rsvpsPath = path.join(dataDir, "wedding-rsvps.json");

async function ensureDataDir() {
  await fs.mkdir(dataDir, {recursive: true});
}

async function readConfigFromFile(): Promise<WeddingConfig> {
  try {
    const raw = await fs.readFile(configPath, "utf8");
    return normalizeWeddingConfig(JSON.parse(raw));
  } catch {
    return defaultWeddingConfig;
  }
}

async function writeConfigToFile(config: WeddingConfig): Promise<WeddingConfig> {
  const normalized = normalizeWeddingConfig(config);
  await ensureDataDir();
  await fs.writeFile(configPath, JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
}

async function readRsvpsFromFile(): Promise<WeddingRsvp[]> {
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

export async function readWeddingConfig(): Promise<WeddingConfig> {
  const cfg = getCfD1Config();
  if (cfg) {
    const fromD1 = await d1ReadWeddingConfig(cfg);
    if (fromD1) return fromD1;
    return defaultWeddingConfig;
  }
  return readConfigFromFile();
}

export async function writeWeddingConfig(config: WeddingConfig): Promise<WeddingConfig> {
  const normalized = normalizeWeddingConfig(config);
  const cfg = getCfD1Config();
  if (cfg) {
    return d1WriteWeddingConfig(cfg, normalized);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("d1_required");
  }
  return writeConfigToFile(normalized);
}

export async function readWeddingRsvps(): Promise<WeddingRsvp[]> {
  const cfg = getCfD1Config();
  if (cfg) {
    return d1ReadWeddingRsvps(cfg);
  }
  return readRsvpsFromFile();
}

export async function addWeddingRsvp(
  input: Omit<WeddingRsvp, "id" | "createdAt">
): Promise<WeddingRsvp> {
  const cfg = getCfD1Config();
  if (cfg) {
    return d1AddWeddingRsvp(cfg, input);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("d1_required");
  }

  const rows = await readRsvpsFromFile();
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

export function weddingStorageMode(): "d1" | "file" {
  return hasWeddingD1() ? "d1" : "file";
}
