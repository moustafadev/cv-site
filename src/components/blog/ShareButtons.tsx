"use client";

import {useEffect, useState} from "react";
import {useTranslations} from "next-intl";

type Target = {name: string; href: (url: string, title: string) => string};

const TARGETS: Target[] = [
  {name: "WhatsApp", href: (u, t) => `https://wa.me/?text=${encodeURIComponent(`${t} ${u}`)}`},
  {name: "Telegram", href: (u, t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`},
  {name: "LinkedIn", href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`},
  {name: "X", href: (u, t) => `https://x.com/intent/post?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`},
  {name: "Facebook", href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`}
];

export function ShareButtons({url, title}: {url: string; title: string}) {
  const t = useTranslations("blog");
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt(t("copyLink"), url);
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function nativeShare() {
    try {
      await navigator.share({title, url});
    } catch {
      // User closed the share sheet.
    }
  }

  const chip =
    "inline-flex items-center rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-sky-400 hover:text-sky-200";

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={t("shareVia")}>
      {canNativeShare ? (
        <button type="button" onClick={() => void nativeShare()} className={`${chip} border-sky-700 text-sky-200`}>
          {t("share")}
        </button>
      ) : null}
      {TARGETS.map((target) => (
        <a key={target.name} href={target.href(url, title)} target="_blank" rel="noopener noreferrer" className={chip}>
          {target.name}
        </a>
      ))}
      <button type="button" onClick={() => void copy()} className={chip}>
        {copied ? t("copied") : t("copyLink")}
      </button>
    </div>
  );
}
