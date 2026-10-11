import {NextResponse} from "next/server";

/**
 * Android App Links: lets Pauzo open https://<site>/pauzo/invite links
 * directly. PAUZO_ANDROID_CERT_SHA256 = the app signing certificate's
 * SHA-256 from Play Console → Setup → App signing (comma-separated if you
 * also want the upload key for local builds).
 */
export function GET() {
  const fingerprints = (process.env.PAUZO_ANDROID_CERT_SHA256 ?? "")
    .split(",")
    .map((f) => f.trim().toUpperCase())
    .filter(Boolean);
  const body = fingerprints.length
    ? [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: {
            namespace: "android_app",
            package_name: process.env.PAUZO_ANDROID_PACKAGE?.trim() || "com.pauzo.app",
            sha256_cert_fingerprints: fingerprints
          }
        }
      ]
    : [];
  return NextResponse.json(body, {headers: {"Cache-Control": "public, max-age=3600"}});
}
