"use client";

import {createPortal} from "react-dom";
import {useEffect, useRef, useState} from "react";

/** Post image in a fixed-size frame (see .post-img in globals.css); click opens it full size. */
export function PostImage({src, alt = "", eager = false}: {src: string; alt?: string; eager?: boolean}) {
  const [isOpen, setIsOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
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

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className="post-img-button" aria-haspopup="dialog">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} className="post-img" />
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="lightbox-backdrop fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overscroll-contain bg-slate-950/95 p-4 pb-10 pt-16 backdrop-blur-md"
              role="dialog"
              aria-modal="true"
              onClick={() => setIsOpen(false)}
            >
              <button
                ref={closeRef}
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="fixed right-4 top-4 z-[101] rounded-full border border-slate-500/80 bg-slate-900/95 px-4 py-2 text-sm font-medium text-slate-100 shadow-lg transition hover:border-sky-400 hover:bg-slate-800"
              >
                ✕
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                onClick={(event) => event.stopPropagation()}
                className="lightbox-photo-frame my-auto block h-auto max-h-[88vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              />
            </div>,
            document.body
          )
        : null}
    </>
  );
}
