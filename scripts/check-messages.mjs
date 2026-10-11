// Message catalog parity: every key in messages/en.json must exist in every other locale, and vice versa.
// Namespaces listed in EN_ONLY are English-only on purpose (the blog has no Russian version).
import {readFileSync, readdirSync} from "node:fs";

const EN_ONLY = new Set(["blog"]);
const dir = new URL("../messages/", import.meta.url);
const load = (file) => JSON.parse(readFileSync(new URL(file, dir), "utf8"));
const keys = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));

const base = new Set(keys(load("en.json")).filter((k) => !EN_ONLY.has(k.split(".")[0])));
let failed = false;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "en.json")) {
  const other = new Set(keys(load(file)).filter((k) => !EN_ONLY.has(k.split(".")[0])));
  const missing = [...base].filter((k) => !other.has(k));
  const extra = [...other].filter((k) => !base.has(k));
  if (missing.length || extra.length) {
    failed = true;
    if (missing.length) console.error(`${file}: missing ${missing.join(", ")}`);
    if (extra.length) console.error(`${file}: not in en.json ${extra.join(", ")}`);
  } else {
    console.log(`${file}: ${other.size} keys match en.json`);
  }
}
process.exit(failed ? 1 : 0);
