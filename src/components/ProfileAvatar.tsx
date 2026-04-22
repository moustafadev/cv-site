"use client";

import Image from "next/image";
import {createPortal} from "react-dom";
import {useEffect, useRef, useState} from "react";

type ProfileAvatarProps = {
  locale?: "en" | "ru";
};

export function ProfileAvatar({locale = "en"}: ProfileAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const closeLabel = locale === "en" ? "Close" : "Закрыть";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-sky-600/70 bg-slate-900 shadow-lg shadow-sky-900/30 transition hover:scale-105 hover:border-sky-400"
        aria-label={locale === "en" ? "Open profile photo" : "Открыть фото профиля"}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Image
          src="/profile-mostafa.png"
          alt="Mostafa Omar profile photo"
          width={40}
          height={40}
          className="h-full w-full object-contain"
        />
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="lightbox-backdrop fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overscroll-contain bg-slate-950/95 p-4 pb-10 pt-16 backdrop-blur-md"
              role="dialog"
              aria-modal="true"
              aria-label={locale === "en" ? "Profile photo" : "Фото профиля"}
              onClick={() => setIsOpen(false)}
            >
              <button
                ref={closeRef}
                type="button"
                onClick={() => setIsOpen(false)}
                className="fixed right-4 top-4 z-[101] rounded-full border border-slate-500/80 bg-slate-900/95 px-4 py-2 text-sm font-medium text-slate-100 shadow-lg transition hover:border-sky-400 hover:bg-slate-800 hover:text-white"
              >
                {closeLabel}
              </button>

              <div
                className="lightbox-photo-frame my-auto flex w-full max-w-4xl flex-col items-center justify-center"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="relative w-full rounded-3xl border border-slate-600/60 bg-gradient-to-b from-slate-800/40 to-slate-950/80 p-2 shadow-2xl ring-1 ring-sky-500/15 sm:p-3">
                  <div className="overflow-hidden rounded-2xl bg-slate-900">
                    <img
                      src="/profile-mostafa.png"
                      alt="Mostafa Omar profile photo"
                      className="mx-auto block h-auto max-h-[min(85vh,900px)] w-auto max-w-full object-contain"
                      decoding="async"
                    />
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
