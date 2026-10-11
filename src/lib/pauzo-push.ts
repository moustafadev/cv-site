import {googleAccessToken, readServiceAccount} from "@/lib/google-service-account";

/**
 * «Your friend joined» push to the device that created the code, via FCM
 * HTTP v1. Needs PAUZO_FCM_SERVICE_ACCOUNT (Firebase → Project settings →
 * Service accounts → Generate new private key). Silently skipped without it
 * or without a token: the app still finds out on its next open.
 */

const COPY: Record<string, {title: string; body: string}> = {
  "ar-EG": {title: "صاحبك دخل!", body: "Pauzo اتفتح عندكم انتوا الاتنين للأبد."},
  ar: {title: "انضم صديقك!", body: "فُتح Pauzo لكليكما للأبد."},
  ru: {title: "Друг присоединился!", body: "Pauzo открыт навсегда у вас обоих."},
  en: {title: "Your friend joined!", body: "Pauzo is now unlocked for both of you, for good."}
};

function copyFor(locale: string) {
  return COPY[locale] ?? COPY[locale.split("-")[0] ?? ""] ?? COPY.en!;
}

export async function sendPartnerJoinedPush(fcmToken: string, locale: string): Promise<void> {
  const account = readServiceAccount("PAUZO_FCM_SERVICE_ACCOUNT");
  if (!account || !fcmToken) return;
  try {
    const accessToken = await googleAccessToken(account, "https://www.googleapis.com/auth/firebase.messaging");
    const {title, body} = copyFor(locale);
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`, {
      method: "POST",
      headers: {Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json"},
      body: JSON.stringify({
        message: {
          token: fcmToken,
          notification: {title, body},
          data: {type: "partner_joined"},
          android: {priority: "high", notification: {channel_id: "pauzo_access"}},
          apns: {payload: {aps: {sound: "default"}}}
        }
      })
    });
    if (!res.ok) console.error("[pauzo:push]", res.status, (await res.text()).slice(0, 300));
  } catch (error) {
    console.error("[pauzo:push]", error);
  }
}
