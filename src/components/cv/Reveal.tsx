"use client";

import {useEffect, useRef, useState} from "react";

/**
 * Fades/slides its content in the first time it scrolls into view.
 * Hidden only once JS is running (html.js, set in the root layout), so content never stays invisible without JS.
 */
export function Reveal({
  children,
  delay = 0,
  className = ""
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      {rootMargin: "0px 0px -8% 0px", threshold: 0.08}
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${shown ? "reveal-in" : ""} ${className}`} style={delay ? {transitionDelay: `${delay}ms`} : undefined}>
      {children}
    </div>
  );
}
