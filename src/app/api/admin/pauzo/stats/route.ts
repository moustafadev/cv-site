import {NextResponse} from "next/server";
import {getPauzoStats} from "@/lib/pauzo";
import {isPauzoConfigured} from "@/lib/pauzo-db";
import {pauzoError} from "@/lib/pauzo-request";
import {requireAdmin} from "@/lib/require-admin";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    if (!isPauzoConfigured()) return NextResponse.json({ok: true, configured: false, stats: null});
    return NextResponse.json({ok: true, configured: true, stats: await getPauzoStats()});
  } catch (error) {
    return pauzoError(error);
  }
}
