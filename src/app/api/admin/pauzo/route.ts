import {NextResponse} from "next/server";
import {dailyCounts, getPauzoStats, listDevices, listPairs, listPurchases, type AdminDeviceFilter} from "@/lib/pauzo";
import {isPauzoConfigured} from "@/lib/pauzo-db";
import {pauzoError} from "@/lib/pauzo-request";
import {requireAdmin} from "@/lib/require-admin";

const FILTERS: AdminDeviceFilter[] = ["all", "trial", "expired", "unlocked", "paid"];
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
    const [stats, daily, pairs, devices, purchases] = await Promise.all([
      getPauzoStats(),
      dailyCounts(CHART_DAYS),
      listPairs(),
      listDevices(filter, query),
      listPurchases()
    ]);
    return NextResponse.json({ok: true, configured: true, stats, daily, pairs, devices, purchases});
  } catch (error) {
    return pauzoError(error);
  }
}
