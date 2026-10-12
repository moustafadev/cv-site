import {NextResponse} from "next/server";
import {leaveHousehold} from "@/lib/pauzo-household";
import {householdError} from "@/lib/pauzo-household-request";
import {requireDevice} from "@/lib/pauzo-request";

export async function POST(request: Request) {
  try {
    const device = await requireDevice(request);
    await leaveHousehold(device);
    return NextResponse.json({ok: true, household: null});
  } catch (error) {
    return householdError(error);
  }
}
