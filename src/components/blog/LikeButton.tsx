"use client";

import {useState} from "react";
import {useTranslations} from "next-intl";

export function LikeButton({postId, initialLiked, initialCount}: {postId: string; initialLiked: boolean; initialCount: number}) {
  const t = useTranslations("blog");
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    const next = !liked;
    setBusy(true);
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      const res = await fetch(`/api/blog/posts/${postId}/like`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "same-origin",
        body: JSON.stringify({liked: next})
      });
      const json = (await res.json()) as {ok?: boolean; liked?: boolean; likes?: number};
      if (!res.ok || !json.ok) throw new Error("like_failed");
      setLiked(Boolean(json.liked));
      setCount(Number(json.likes) || 0);
    } catch {
      setLiked(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      aria-pressed={liked}
      aria-label={liked ? t("unlike") : t("like")}
      className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
        liked
          ? "border-rose-500/70 bg-rose-500/15 text-rose-200"
          : "border-slate-700 text-slate-300 hover:border-rose-400/70 hover:text-rose-200"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-5 w-5 transition-transform ${liked ? "like-pop fill-rose-500 stroke-rose-500" : "fill-none stroke-current group-hover:scale-110"}`}
        strokeWidth="2"
        aria-hidden="true"
      >
        <path
          strokeLinejoin="round"
          d="M12 20.3l-1.3-1.2C6 14.8 3 12.1 3 8.8 3 6.1 5.1 4 7.8 4c1.5 0 3 .7 4.2 1.9C13.2 4.7 14.7 4 16.2 4 18.9 4 21 6.1 21 8.8c0 3.3-3 6-7.7 10.3L12 20.3z"
        />
      </svg>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
