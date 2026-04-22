"use client";

import Image from "next/image";
import {useEffect, useState} from "react";

export function ProfileAvatar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-sky-600/70 bg-slate-900 shadow-lg shadow-sky-900/30 transition hover:scale-105 hover:border-sky-400"
        aria-label="Open profile photo"
      >
        <Image
          src="/profile-mostafa.png"
          alt="Mostafa Omar profile photo"
          width={40}
          height={40}
          className="h-full w-full object-contain"
        />
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-slate-950/90 p-4 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-4 rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-200 hover:border-slate-400"
          >
            Close
          </button>
          <Image
            src="/profile-mostafa.png"
            alt="Mostafa Omar profile photo"
            width={900}
            height={900}
            priority
            className="h-auto max-h-[88vh] w-auto max-w-full rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
