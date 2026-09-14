"use client";

import {useEffect} from "react";

/** Counts one view per post per browser tab session. */
export function PostViewTracker({postId}: {postId: string}) {
  useEffect(() => {
    const key = `blog_viewed_${postId}`;
    try {
      if (sessionStorage.getItem(key) === "1") return;
    } catch {
      // Storage blocked (private mode / in-app browsers) — count anyway.
    }
    void fetch(`/api/blog/posts/${postId}/view`, {method: "POST", credentials: "same-origin", keepalive: true})
      .then((res) => {
        if (!res.ok) return;
        try {
          sessionStorage.setItem(key, "1");
        } catch {
          // ignore
        }
      })
      .catch(() => {});
  }, [postId]);

  return null;
}
