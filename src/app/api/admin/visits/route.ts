import {NextResponse} from "next/server";
import {getVisits} from "@/lib/cv-analytics";
import {requireAdmin} from "@/lib/require-admin";

/** GET /api/admin/visits?source=&country=&platform=&path=&since=&q=&offset= — filtered CV visits. */
export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const url = new URL(request.url);
  const text = (key: string, max = 300) => url.searchParams.get(key)?.trim().slice(0, max) || undefined;
  try {
    const result = await getVisits({
      source: text("source"),
      country: text("country", 3),
      platform: text("platform", 40),
      path: text("path", 500),
      since: Number(url.searchParams.get("since")) || undefined,
      q: text("q", 100),
      offset: Number(url.searchParams.get("offset")) || 0
    });
    if (!result) return NextResponse.json({ok: true, configured: false, total: 0, rows: [], options: null});
    return NextResponse.json({ok: true, configured: true, ...result});
  } catch (error) {
    return NextResponse.json({ok: false, error: error instanceof Error ? error.message.slice(0, 200) : "server_error"}, {status: 500});
  }
}
