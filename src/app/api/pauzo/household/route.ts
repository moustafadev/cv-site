import {NextResponse} from "next/server";
import {getEntitlement} from "@/lib/pauzo";
import {createHousehold, getHousehold, renameMember} from "@/lib/pauzo-household";
import {householdError} from "@/lib/pauzo-household-request";
import {cleanString, readJson, requireDevice} from "@/lib/pauzo-request";

/** The household this phone is in, or null. */
export async function GET(request: Request) {
  try {
    const device = await requireDevice(request);
    return NextResponse.json({ok: true, household: await getHousehold(device)});
  } catch (error) {
    return householdError(error);
  }
}

/** Starts a shared budget (premium), or renames this member in the current one. */
export async function POST(request: Request) {
  try {
    const device = await requireDevice(request);
    const raw = await readJson<Record<string, unknown>>(request);
    const name = cleanString(raw.name, 30);
    const current = await getHousehold(device);
    if (current) {
      if (name) await renameMember(device, name);
      return NextResponse.json({ok: true, household: await getHousehold(device)});
    }
    if (!(await getEntitlement(device)).premium) {
      return NextResponse.json({ok: false, error: "premium_required"}, {status: 402});
    }
    return NextResponse.json({ok: true, household: await createHousehold(device, name)});
  } catch (error) {
    return householdError(error);
  }
}
