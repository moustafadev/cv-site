import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {ADMIN_COOKIE, verifyAdminToken} from "@/lib/admin-session";
import {getAnalyticsDiagnostics, getCvStats, isCvAnalyticsConfigured} from "@/lib/cv-analytics";

export async function GET() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!(await verifyAdminToken(secret, token))) {
    return NextResponse.json({ok: false, error: "unauthorized"}, {status: 401});
  }
  if (!isCvAnalyticsConfigured()) {
    return NextResponse.json({
      ok: true,
      configured: false,
      stats: null,
      diagnostics: getAnalyticsDiagnostics()
    });
  }
  const stats = await getCvStats();
  return NextResponse.json({ok: true, configured: true, stats, diagnostics: getAnalyticsDiagnostics()});
}
