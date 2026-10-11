import {NextResponse} from "next/server";
import {adminUpdateDevice, type AdminDeviceAction} from "@/lib/pauzo";
import {cleanString, pauzoError, readJson} from "@/lib/pauzo-request";
import {requireAdmin} from "@/lib/require-admin";

const ACTIONS: AdminDeviceAction[] = ["unlock", "extend_trial", "reset_trial"];

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await readJson<{id?: unknown; action?: unknown}>(request);
    const id = cleanString(body.id, 64);
    const action = cleanString(body.action, 20) as AdminDeviceAction;
    if (!id || !ACTIONS.includes(action)) {
      return NextResponse.json({ok: false, error: "invalid_request"}, {status: 400});
    }
    if (!(await adminUpdateDevice(id, action))) {
      return NextResponse.json({ok: false, error: "device_not_found"}, {status: 404});
    }
    return NextResponse.json({ok: true});
  } catch (error) {
    return pauzoError(error);
  }
}
