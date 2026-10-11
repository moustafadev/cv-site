import {NextResponse} from "next/server";

/** iOS Universal Links for /pauzo/invite. PAUZO_APPLE_TEAM_ID from the Apple developer account. */
export function GET() {
  const team = process.env.PAUZO_APPLE_TEAM_ID?.trim();
  const bundle = process.env.PAUZO_APPLE_BUNDLE_ID?.trim() || "com.pauzo.app";
  const body = team
    ? {applinks: {details: [{appIDs: [`${team}.${bundle}`], components: [{"/": "/pauzo/invite*"}]}]}}
    : {applinks: {details: []}};
  return NextResponse.json(body, {headers: {"Cache-Control": "public, max-age=3600"}});
}
