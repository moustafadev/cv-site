"use client";

import {useState} from "react";

export function CopyCode({code, label, done}: {code: string; label: string; done: string}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="rounded-full border border-violet-400/60 px-5 py-2.5 text-sm font-semibold text-violet-200 hover:border-violet-300"
    >
      {copied ? done : label}
    </button>
  );
}
