"use client";

import {useEffect} from "react";

const SESSION_KEY = "cv_tracked_session_v1";

function sessionAlreadyTracked(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    // Some mobile / in-app browsers block storage reads; still try to record the view once.
    return false;
  }
}

function markSessionTracked(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Private mode: next full reload may send another view — acceptable vs losing traffic.
  }
}

export function CvViewTracker({locale}: {locale: string}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionAlreadyTracked()) return;

    const landingReferrer = document.referrer || null;
    const path = window.location.pathname;

    void (async () => {
      try {
        const res = await fetch("/api/cv/track", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          credentials: "same-origin",
          keepalive: true,
          body: JSON.stringify({path, locale, landingReferrer})
        });
        // Only mark after a successful write; otherwise the same tab can retry (e.g. after redeploy / D1 fix).
        if (res.ok) markSessionTracked();
      } catch {
        // Network error — do not mark tracked so a later navigation or refresh can retry.
      }
    })();
  }, [locale]);

  return null;
}
