/**
 * OAuth access tokens for a Google service account (FCM, Play Developer
 * API) using only WebCrypto, so it runs on Workers. The account JSON comes
 * from an env var; tokens are cached per isolate until a minute before
 * they expire.
 */

type ServiceAccount = {client_email: string; private_key: string; project_id?: string};

const cache = globalThis as unknown as {__gsaTokens?: Map<string, {token: string; expiresAt: number}>};

export function readServiceAccount(envName: string): ServiceAccount | null {
  const raw = process.env[envName]?.trim();
  if (!raw) return null;
  try {
    // Accept the JSON as-is or base64-encoded (easier to paste as a secret).
    const json = raw.startsWith("{") ? raw : atob(raw);
    const parsed = JSON.parse(json) as ServiceAccount;
    return parsed.client_email && parsed.private_key ? parsed : null;
  } catch {
    return null;
  }
}

function base64url(data: ArrayBuffer | Uint8Array | string): string {
  const bytes =
    typeof data === "string" ? new TextEncoder().encode(data) : data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToDer(pem: string): ArrayBuffer {
  const body = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const binary = atob(body);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out.buffer;
}

export async function googleAccessToken(account: ServiceAccount, scope: string): Promise<string> {
  const store = (cache.__gsaTokens ??= new Map());
  const cacheKey = `${account.client_email}|${scope}`;
  const hit = store.get(cacheKey);
  if (hit && hit.expiresAt > Date.now() + 60_000) return hit.token;

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({alg: "RS256", typ: "JWT"}));
  const claims = base64url(
    JSON.stringify({
      iss: account.client_email,
      scope,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600
    })
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(account.private_key),
    {name: "RSASSA-PKCS1-v1_5", hash: "SHA-256"},
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claims}`));
  const assertion = `${header}.${claims}.${base64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams({grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion})
  });
  const json = (await res.json()) as {access_token?: string; expires_in?: number; error_description?: string};
  if (!res.ok || !json.access_token) throw new Error(`google_token_${res.status}: ${json.error_description ?? ""}`);
  store.set(cacheKey, {token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000});
  return json.access_token;
}

export {base64url, pemToDer};
