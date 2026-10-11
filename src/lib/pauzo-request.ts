import {NextResponse} from "next/server";
import {PauzoNotConfiguredError} from "@/lib/pauzo-db";
import {findDeviceByToken, type Device} from "@/lib/pauzo";

export class PauzoApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number
  ) {
    super(code);
  }
}

export function pauzoError(error: unknown): NextResponse {
  if (error instanceof PauzoApiError) {
    return NextResponse.json({ok: false, error: error.code}, {status: error.status});
  }
  if (error instanceof PauzoNotConfiguredError) {
    return NextResponse.json({ok: false, error: "not_configured"}, {status: 503});
  }
  console.error("[pauzo]", error);
  return NextResponse.json({ok: false, error: "server_error"}, {status: 500});
}

export async function readJson<T extends object>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new PauzoApiError("invalid_json", 400);
  }
}

/** The app sends the token it got from /device/register as a bearer token. */
export async function requireDevice(request: Request): Promise<Device> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!/^[0-9a-f]{64}$/.test(token)) throw new PauzoApiError("unauthorized", 401);
  const device = await findDeviceByToken(token);
  if (!device) throw new PauzoApiError("unauthorized", 401);
  return device;
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function cleanString(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
