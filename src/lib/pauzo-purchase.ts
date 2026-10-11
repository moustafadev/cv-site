import {base64url, googleAccessToken, pemToDer, readServiceAccount} from "@/lib/google-service-account";

/**
 * Server-side check of the one-time «unlock on your own» purchase before a
 * device is marked paid. Google: Play Developer API with a service account
 * linked in Play Console (PAUZO_PLAY_SERVICE_ACCOUNT). Apple: App Store
 * Server API with an in-app purchase key (PAUZO_APPLE_ISSUER_ID,
 * PAUZO_APPLE_KEY_ID, PAUZO_APPLE_PRIVATE_KEY, PAUZO_APPLE_BUNDLE_ID).
 */

export const UNLOCK_PRODUCT_ID = process.env.PAUZO_UNLOCK_PRODUCT_ID?.trim() || "pauzo_unlock";
const ANDROID_PACKAGE = process.env.PAUZO_ANDROID_PACKAGE?.trim() || "com.pauzo.app";

export type VerifiedPurchase = {transactionId: string};
export type PurchaseCheck = {ok: true; purchase: VerifiedPurchase} | {ok: false; error: string};

export async function verifyGooglePurchase(productId: string, purchaseToken: string): Promise<PurchaseCheck> {
  const account = readServiceAccount("PAUZO_PLAY_SERVICE_ACCOUNT");
  if (!account) return {ok: false, error: "purchase_not_configured"};
  if (productId !== UNLOCK_PRODUCT_ID) return {ok: false, error: "unknown_product"};
  const accessToken = await googleAccessToken(account, "https://www.googleapis.com/auth/androidpublisher");
  const url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${ANDROID_PACKAGE}` +
    `/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
  const res = await fetch(url, {headers: {Authorization: `Bearer ${accessToken}`}});
  if (res.status === 404 || res.status === 400) return {ok: false, error: "purchase_invalid"};
  if (!res.ok) throw new Error(`play_${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as {purchaseState?: number; orderId?: string};
  // 0 = purchased, 1 = canceled, 2 = pending.
  if (json.purchaseState === 2) return {ok: false, error: "purchase_pending"};
  if (json.purchaseState !== 0) return {ok: false, error: "purchase_invalid"};
  return {ok: true, purchase: {transactionId: json.orderId || purchaseToken.slice(0, 120)}};
}

async function appleJwt(): Promise<string | null> {
  const issuer = process.env.PAUZO_APPLE_ISSUER_ID?.trim();
  const keyId = process.env.PAUZO_APPLE_KEY_ID?.trim();
  const pem = process.env.PAUZO_APPLE_PRIVATE_KEY?.trim();
  const bundleId = process.env.PAUZO_APPLE_BUNDLE_ID?.trim() || "com.pauzo.app";
  if (!issuer || !keyId || !pem) return null;
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({alg: "ES256", kid: keyId, typ: "JWT"}));
  const claims = base64url(JSON.stringify({iss: issuer, iat: now, exp: now + 1200, aud: "appstoreconnect-v1", bid: bundleId}));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(pem.replace(/\\n/g, "\n")),
    {name: "ECDSA", namedCurve: "P-256"},
    false,
    ["sign"]
  );
  // WebCrypto already returns the raw r||s form JWS needs for ES256.
  const sig = await crypto.subtle.sign({name: "ECDSA", hash: "SHA-256"}, key, new TextEncoder().encode(`${header}.${claims}`));
  return `${header}.${claims}.${base64url(sig)}`;
}

function decodeJwsPayload<T>(jws: string): T {
  const part = jws.split(".")[1] ?? "";
  const padded = part.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((part.length + 3) % 4);
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(padded), (c) => c.charCodeAt(0)))) as T;
}

/**
 * Asks Apple directly for the transaction (production, then sandbox). The
 * response comes over TLS from Apple, so its signed payload is trusted as
 * fetched rather than re-verified against Apple's certificate chain.
 */
export async function verifyApplePurchase(productId: string, transactionId: string): Promise<PurchaseCheck> {
  const jwt = await appleJwt();
  if (!jwt) return {ok: false, error: "purchase_not_configured"};
  if (productId !== UNLOCK_PRODUCT_ID) return {ok: false, error: "unknown_product"};
  if (!/^\d{1,30}$/.test(transactionId)) return {ok: false, error: "purchase_invalid"};
  for (const host of ["https://api.storekit.itunes.apple.com", "https://api.storekit-sandbox.itunes.apple.com"]) {
    const res = await fetch(`${host}/inApps/v1/transactions/${transactionId}`, {headers: {Authorization: `Bearer ${jwt}`}});
    if (res.status === 404) continue;
    if (!res.ok) throw new Error(`appstore_${res.status}: ${(await res.text()).slice(0, 200)}`);
    const {signedTransactionInfo} = (await res.json()) as {signedTransactionInfo?: string};
    if (!signedTransactionInfo) return {ok: false, error: "purchase_invalid"};
    const tx = decodeJwsPayload<{productId?: string; bundleId?: string; revocationDate?: number; originalTransactionId?: string}>(
      signedTransactionInfo
    );
    const bundleId = process.env.PAUZO_APPLE_BUNDLE_ID?.trim() || "com.pauzo.app";
    if (tx.productId !== productId || tx.bundleId !== bundleId || tx.revocationDate) {
      return {ok: false, error: "purchase_invalid"};
    }
    return {ok: true, purchase: {transactionId: tx.originalTransactionId || transactionId}};
  }
  return {ok: false, error: "purchase_invalid"};
}
