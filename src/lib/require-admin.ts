import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {ADMIN_COOKIE, verifyAdminToken} from "@/lib/admin-session";

export async function requireAdmin(): Promise<NextResponse | null> {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const ok = await verifyAdminToken(secret, token);
  if (!ok) {
    return NextResponse.json({ok: false, error: "unauthorized"}, {status: 401});
  }
  return null;
}
