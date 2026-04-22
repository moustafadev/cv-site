import {NextResponse} from "next/server";
import {ADMIN_COOKIE, createAdminToken} from "@/lib/admin-session";

export async function POST(request: Request) {
  const password = process.env.ADMIN_PASSWORD?.trim();
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!password || !secret) {
    return NextResponse.json(
      {
        ok: false,
        error: "admin_not_configured",
        hint: "Add ADMIN_PASSWORD and ADMIN_SESSION_SECRET to .env.local (non-empty), then restart npm run dev."
      },
      {status: 503}
    );
  }
  let body: {password?: string} = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ok: false, error: "invalid_json"}, {status: 400});
  }
  if (typeof body.password !== "string" || body.password.trim() !== password) {
    return NextResponse.json({ok: false, error: "unauthorized"}, {status: 401});
  }
  const token = await createAdminToken(secret);
  const res = NextResponse.json({ok: true});
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return res;
}
