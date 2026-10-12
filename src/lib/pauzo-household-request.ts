import {NextResponse} from "next/server";
import {HouseholdError} from "@/lib/pauzo-household";
import {pauzoError} from "@/lib/pauzo-request";

const STATUS: Record<string, number> = {
  invalid_code: 404,
  household_full: 409,
  already_in_household: 409,
  no_household: 404
};

export function householdError(error: unknown): NextResponse {
  if (error instanceof HouseholdError) {
    return NextResponse.json({ok: false, error: error.code}, {status: STATUS[error.code] ?? 400});
  }
  return pauzoError(error);
}
