import {promises as fs} from "node:fs";
import path from "node:path";
import {NextResponse} from "next/server";
import {requireAdmin} from "@/lib/require-admin";
import {readWeddingConfig, writeWeddingConfig} from "@/lib/wedding-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const form = await request.formData();
  const kind = String(form.get("kind") || "");
  const file = form.get("file");

  if ((kind !== "video" && kind !== "poster") || !(file instanceof File)) {
    return NextResponse.json({ok: false, error: "invalid_payload"}, {status: 400});
  }

  const maxBytes = kind === "video" ? 40 * 1024 * 1024 : 8 * 1024 * 1024;
  if (file.size <= 0 || file.size > maxBytes) {
    return NextResponse.json({ok: false, error: "file_too_large"}, {status: 400});
  }

  const ext =
    kind === "video"
      ? file.type.includes("webm")
        ? ".webm"
        : ".mp4"
      : file.type.includes("png")
        ? ".png"
        : file.type.includes("webp")
          ? ".webp"
          : ".jpg";

  const filename = kind === "video" ? `invite${ext}` : `invite-poster${ext}`;
  const dir = path.join(process.cwd(), "public", "wedding");
  await fs.mkdir(dir, {recursive: true});
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, filename), buffer);

  const publicPath = `/wedding/${filename}?v=${Date.now()}`;
  const config = await readWeddingConfig();
  const next = {
    ...config,
    ...(kind === "video" ? {video: publicPath} : {poster: publicPath}),
  };
  const saved = await writeWeddingConfig(next);
  return NextResponse.json({ok: true, config: saved, path: publicPath});
}
