"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import type {BlogComment} from "@/lib/blog";

type TurnstileApi = {
  render(el: HTMLElement, opts: {sitekey: string; theme?: string; size?: string; callback(token: string): void; "expired-callback"(): void}): string;
  reset(id: string): void;
  remove(id: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstileScript: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  turnstileScript ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      turnstileScript = null;
      reject(new Error("turnstile_load_failed"));
    };
    document.head.appendChild(s);
  });
  return turnstileScript;
}

function useTurnstile(siteKey: string | null) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    let cancelled = false;
    void loadTurnstile()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          theme: "dark",
          size: "flexible",
          callback: setToken,
          "expired-callback": () => setToken("")
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [siteKey]);

  const reset = useCallback(() => {
    setToken("");
    if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
  }, []);

  return {ref, token, reset, required: Boolean(siteKey)};
}

const NAME_KEY = "blog_comment_name";
const KNOWN_ERRORS = [
  "invalid_name",
  "invalid_body",
  "too_many_links",
  "captcha_failed",
  "rate_limited",
  "post_not_found",
  "parent_not_found"
];

function CommentForm({
  postId,
  parentId,
  isAdmin,
  turnstileSiteKey,
  onPosted,
  onCancel
}: {
  postId: string;
  parentId: string | null;
  isAdmin: boolean;
  turnstileSiteKey: string | null;
  onPosted(comment: BlogComment): void;
  onCancel?(): void;
}) {
  const t = useTranslations("blog");
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const turnstile = useTurnstile(isAdmin ? null : turnstileSiteKey);

  useEffect(() => {
    try {
      setName(localStorage.getItem(NAME_KEY) ?? "");
    } catch {
      // Storage blocked — the visitor just types their name.
    }
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/blog/posts/${postId}/comments`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "same-origin",
        body: JSON.stringify({name, body, parentId, website, turnstileToken: turnstile.token})
      });
      const json = (await res.json().catch(() => ({}))) as {ok?: boolean; error?: string; comment?: BlogComment | null};
      if (!res.ok || !json.ok) {
        setError(KNOWN_ERRORS.includes(json.error ?? "") ? t(`errors.${json.error}`) : t("errors.generic"));
        turnstile.reset();
        return;
      }
      try {
        if (!isAdmin) localStorage.setItem(NAME_KEY, name.trim());
      } catch {
        // ignore
      }
      setBody("");
      turnstile.reset();
      if (json.comment) onPosted(json.comment);
    } catch {
      setError(t("errors.generic"));
    } finally {
      setSending(false);
    }
  }

  const input =
    "w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none";

  return (
    <form onSubmit={submit} className="relative space-y-3">
      {isAdmin ? (
        <p className="text-xs font-medium text-sky-300">{t("postingAsAuthor")}</p>
      ) : (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          aria-label={t("namePlaceholder")}
          maxLength={60}
          required
          className={`${input} sm:max-w-xs`}
        />
      )}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={parentId ? t("replyPlaceholder") : t("commentPlaceholder")}
        aria-label={parentId ? t("replyPlaceholder") : t("commentPlaceholder")}
        maxLength={2000}
        rows={parentId ? 3 : 4}
        required
        autoFocus={Boolean(parentId)}
        dir="auto"
        className={`${input} resize-y`}
      />
      {/* Honeypot: invisible to people, tempting to bots. */}
      <input
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px opacity-0"
      />
      {turnstile.required ? <div ref={turnstile.ref} className="min-h-[65px]" /> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={sending || (turnstile.required && !turnstile.token)}
          className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? t("sending") : parentId ? t("submitReply") : t("submit")}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-200">
            {t("cancel")}
          </button>
        ) : null}
      </div>
    </form>
  );
}

const AVATAR_COLORS = ["bg-sky-600", "bg-emerald-600", "bg-violet-600", "bg-amber-600", "bg-rose-600", "bg-teal-600", "bg-indigo-600"];

function avatarColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length]!;
}

function CommentItem({
  comment,
  canDelete,
  onReply,
  onDelete,
  children
}: {
  comment: BlogComment;
  canDelete: boolean;
  onReply?(): void;
  onDelete(): void;
  children?: React.ReactNode;
}) {
  const t = useTranslations("blog");
  const locale = useLocale();
  const date = new Date(comment.createdAt);

  return (
    <li className="flex gap-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${
          comment.isAuthor ? "bg-gradient-to-br from-sky-400 to-brand-500 ring-2 ring-sky-300/40" : avatarColor(comment.name)
        }`}
        aria-hidden="true"
      >
        {comment.name.trim().charAt(0).toUpperCase() || "?"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium text-slate-100">{comment.name}</span>
          {comment.isAuthor ? (
            <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-300">
              {t("author")}
            </span>
          ) : null}
          {comment.mine && !comment.isAuthor ? (
            <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[11px] text-slate-300">{t("you")}</span>
          ) : null}
          <time dateTime={date.toISOString()} suppressHydrationWarning className="text-xs text-slate-500">
            {date.toLocaleString(locale, {dateStyle: "medium", timeStyle: "short"})}
          </time>
        </div>
        <p dir="auto" className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
          {comment.body}
        </p>
        <div className="mt-1 flex gap-3 text-xs">
          {onReply ? (
            <button type="button" onClick={onReply} className="font-medium text-slate-400 hover:text-sky-300">
              {t("reply")}
            </button>
          ) : null}
          {canDelete ? (
            <button type="button" onClick={onDelete} className="text-slate-500 hover:text-rose-300">
              {t("delete")}
            </button>
          ) : null}
        </div>
        {children}
      </div>
    </li>
  );
}

export function Comments({
  postId,
  initialComments,
  isAdmin,
  turnstileSiteKey
}: {
  postId: string;
  initialComments: BlogComment[];
  isAdmin: boolean;
  turnstileSiteKey: string | null;
}) {
  const t = useTranslations("blog");
  const [comments, setComments] = useState(initialComments);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const topLevel = comments.filter((c) => !c.parentId);

  async function remove(id: string) {
    if (!window.confirm(t("confirmDelete"))) return;
    const res = await fetch(`/api/blog/comments/${id}`, {method: "DELETE", credentials: "same-origin"}).catch(() => null);
    if (res?.ok || res?.status === 404) {
      setComments((cs) => cs.filter((c) => c.id !== id && c.parentId !== id));
    }
  }

  function added(comment: BlogComment) {
    setComments((cs) => [...cs, comment]);
    setReplyTo(null);
  }

  return (
    <section id="comments" className="scroll-mt-24">
      <h2 className="section-title">{t("commentsTitle", {count: comments.length})}</h2>
      <div className="glass-card p-4 md:p-5">
        <CommentForm postId={postId} parentId={null} isAdmin={isAdmin} turnstileSiteKey={turnstileSiteKey} onPosted={added} />
      </div>

      {topLevel.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">{t("noComments")}</p>
      ) : (
        <ul className="mt-6 space-y-6">
          {topLevel.map((comment) => {
            const replies = comments.filter((c) => c.parentId === comment.id);
            return (
              <CommentItem
                key={comment.id}
                comment={comment}
                canDelete={isAdmin || comment.mine}
                onReply={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                onDelete={() => void remove(comment.id)}
              >
                {replies.length > 0 ? (
                  <ul className="mt-4 space-y-4 border-l border-slate-800 pl-4">
                    {replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        canDelete={isAdmin || reply.mine}
                        onDelete={() => void remove(reply.id)}
                      />
                    ))}
                  </ul>
                ) : null}
                {replyTo === comment.id ? (
                  <div className="mt-4 border-l border-sky-800/60 pl-4">
                    <CommentForm
                      postId={postId}
                      parentId={comment.id}
                      isAdmin={isAdmin}
                      turnstileSiteKey={turnstileSiteKey}
                      onPosted={added}
                      onCancel={() => setReplyTo(null)}
                    />
                  </div>
                ) : null}
              </CommentItem>
            );
          })}
        </ul>
      )}
    </section>
  );
}
