import type {Metadata} from "next";
import {RootDocument} from "@/components/RootDocument";

export const metadata: Metadata = {
  title: "Page not found — Mostafa Omar",
  robots: {index: false}
};

/** 404 for URLs that match no route (the app has several root layouts, so this can't come from one of them). */
export default function GlobalNotFound() {
  return (
    <RootDocument lang="en">
      <main className="container-page flex min-h-screen flex-col items-start justify-center gap-5 py-20">
        <p className="font-display text-7xl font-semibold text-accent">404</p>
        <h1 className="font-display text-3xl font-semibold text-white">This page doesn’t exist.</h1>
        <div className="flex flex-wrap gap-3 text-sm">
          <a href="/" className="rounded-full bg-accent px-5 py-2.5 font-semibold text-black">
            Go to the CV
          </a>
          <a href="/blog" className="rounded-full border border-white/15 px-5 py-2.5 text-white hover:border-accent hover:text-accent">
            Read the blog
          </a>
        </div>
      </main>
    </RootDocument>
  );
}
