"use client";

import {useEffect} from "react";

const SESSION_KEY = "cv_tracked_session_v1";

export function CvViewTracker({locale}: {locale: string}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      return;
    }
    const landingReferrer = document.referrer || null;
    const path = window.location.pathname;
    void fetch("/api/cv/track", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      credentials: "same-origin",
      body: JSON.stringify({path, locale, landingReferrer})
    }).finally(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // private mode / blocked storage
      }
    });
  }, [locale]);

  return null;
}
