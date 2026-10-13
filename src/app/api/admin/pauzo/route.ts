import {NextResponse} from "next/server";
import {dailyCounts, getPauzoStats, listDevices, listPairs, listPurchases, type AdminDeviceFilter} from "@/lib/pauzo";
import {isPauzoConfigured} from "@/lib/pauzo-db";
import {getDatabaseStats} from "@/lib/pauzo-db-stats";
import {pauzoError} from "@/lib/pauzo-request";
import {requireAdmin} from "@/lib/require-admin";

const FILTERS: AdminDeviceFilter[] = ["all", "free", "unlocked", "paid"];
const CHART_DAYS = 14;

/** Everything the /admin/pauzo page shows, in one D1 round of queries. */
export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    if (!isPauzoConfigured()) return NextResponse.json({ok: true, configured: false});
    const url = new URL(request.url);
    const rawFilter = url.searchParams.get("status") as AdminDeviceFilter | null;
    const filter = rawFilter && FILTERS.includes(rawFilter) ? rawFilter : "all";
    const query = (url.searchParams.get("q") ?? "").slice(0, 64);
    const [stats, daily, pairs, devices, purchases, database] = await Promise.all([
      getPauzoStats(),
      dailyCounts(CHART_DAYS),
      listPairs(),
      listDevices(filter, query),
      listPurchases(),
      // The page still loads if Cloudflare's API is slow or refuses.
      getDatabaseStats().catch(() => null)
    ]);
    return NextResponse.json({ok: true, configured: true, stats, daily, pairs, devices, purchases, database});
  } catch (error) {
    return pauzoError(error);
  }
}
