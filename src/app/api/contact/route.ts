import {NextRequest, NextResponse} from "next/server";
import {recordContactMessage} from "@/lib/cv-analytics";

function redirectBack(request: NextRequest, locale: string): NextResponse {
  const origin = request.nextUrl.origin;
  const fallback = locale ? `/${locale}` : "/";
  const ref = request.headers.get("referer");
  const redirectUrl = ref && ref.startsWith(origin) ? ref : `${origin}${fallback}`;
  return NextResponse.redirect(redirectUrl, {status: 303});
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const locale = String(form.get("locale") ?? "");
  const name = String(form.get("name") ?? "");
  const email = String(form.get("email") ?? "");
  const message = String(form.get("message") ?? "");

  const saved = await recordContactMessage({locale, name, email, message});
  if (!saved.ok) {
    return NextResponse.json({ok: false, error: saved.reason ?? "save_failed"}, {status: 400});
  }

  const formspreeUrl = process.env.FORMSPREE_URL?.trim() || process.env.NEXT_PUBLIC_FORMSPREE_URL?.trim();
  if (formspreeUrl) {
    try {
      await fetch(formspreeUrl, {
        method: "POST",
        headers: {Accept: "application/json"},
        body: new URLSearchParams({
          name,
          email,
          message,
          _subject: "New portfolio contact"
        })
      });
    } catch {
      // Intentionally ignore forwarding errors to keep local inbox reliable.
    }
  }

  return redirectBack(request, locale);
}
