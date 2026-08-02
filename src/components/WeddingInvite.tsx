"use client";

import {FormEvent, PointerEvent, useEffect, useMemo, useRef, useState} from "react";
import {
  WeddingConfig,
  WeddingLang,
  defaultWeddingConfig,
} from "@/lib/wedding-config";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
};

const copy = {
  en: {
    specialFor: "A SPECIAL INVITATION FOR",
    guest: "Guest",
    youreInvited: "YOU'RE INVITED",
    tapToOpen: "TAP TO OPEN",
    married: "WE'RE GETTING MARRIED",
    confirmAttendance: "CONFIRM YOUR ATTENDANCE",
    countdown: "Countdown",
    toTheBigDay: "To the big day",
    days: "DAYS",
    hours: "HOURS",
    minutes: "MINUTES",
    seconds: "SECONDS",
    dayDetails: "Day Details",
    everything: "Everything you need to know",
    location: "LOCATION",
    openMaps: "Open in Maps",
    addCalendar: "Add to calendar",
    rsvpTitle: "Confirm your attendance",
    rsvpSub: "We hope to count on you",
    fullName: "Full name *",
    willYou: "Will you attend?",
    yes: "Yes, I'll be there!",
    no: "Sorry, I can't make it",
    message: "Message for the couple",
    signature: "Signature",
    clearSignature: "Clear",
    signHere: "Sign here",
    send: "SEND CONFIRMATION",
    waiting: "WE ARE WAITING FOR YOU!",
    bigDayHere: "The big day is here!",
  },
  ar: {
    specialFor: "دعوة خاصة لـ",
    guest: "الضيف",
    youreInvited: "أنت مدعو",
    tapToOpen: "اضغط للفتح",
    married: "سنتزوج",
    confirmAttendance: "تأكيد الحضور",
    countdown: "العد التنازلي",
    toTheBigDay: "حتى يومنا الكبير",
    days: "يوم",
    hours: "ساعة",
    minutes: "دقيقة",
    seconds: "ثانية",
    dayDetails: "تفاصيل اليوم",
    everything: "كل ما تحتاج معرفته",
    location: "الموقع",
    openMaps: "افتح في الخرائط",
    addCalendar: "أضف للتقويم",
    rsvpTitle: "أكد حضورك",
    rsvpSub: "نأمل أن نراك معنا",
    fullName: "الاسم بالكامل *",
    willYou: "هل ستحضر؟",
    yes: "نعم، سأكون هناك!",
    no: "آسف، لا أستطيع الحضور",
    message: "رسالة للعروسين",
    signature: "التوقيع",
    clearSignature: "مسح",
    signHere: "وقّع هنا",
    send: "إرسال التأكيد",
    waiting: "بانتظاركم!",
    bigDayHere: "اليوم الكبير وصل!",
  },
} as const;

function SignaturePad({
  label,
  clearLabel,
  hint,
  onChange,
}: {
  label: string;
  clearLabel: string;
  hint: string;
  onChange: (dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const snapshot = canvas.toDataURL();
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1c211c";
    ctx.lineWidth = 2;
    if (hasInk) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = snapshot;
    }
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pointFromEvent = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {x: e.clientX - rect.left, y: e.clientY - rect.top};
  };

  const startDraw = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    drawing.current = true;
    canvas.setPointerCapture(e.pointerId);
    const {x, y} = pointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const {x, y} = pointFromEvent(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setHasInk(true);
    onChange(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasInk(false);
    onChange(null);
  };

  return (
    <div className="block">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-sm text-black/70">{label}</span>
        {hasInk && (
          <button
            type="button"
            onClick={clear}
            className="text-xs text-black/45 underline-offset-2 hover:text-black hover:underline"
          >
            {clearLabel}
          </button>
        )}
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-white">
        <canvas
          ref={canvasRef}
          className="h-36 w-full touch-none cursor-crosshair"
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={endDraw}
          onPointerCancel={endDraw}
          onPointerLeave={endDraw}
        />
        {!hasInk && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-black/30">
            {hint}
          </p>
        )}
        <div className="pointer-events-none absolute inset-x-6 bottom-4 border-b border-dashed border-black/15" />
      </div>
    </div>
  );
}

function getTimeLeft(target: Date, now: Date): TimeLeft {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) {
    return {days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true};
  }
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isPast: false,
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function buildCalendarUrl(config: WeddingConfig) {
  const start = new Date(config.datetime);
  const end = new Date(start.getTime() + 6 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  const title = encodeURIComponent(`${config.groom.en} & ${config.bride.en} Wedding`);
  const details = encodeURIComponent(`${config.venue.en}, ${config.city.en}`);
  const location = encodeURIComponent(`${config.venue.en}, ${config.city.en}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}&location=${location}`;
}

export function WeddingInvite() {
  const [config, setConfig] = useState<WeddingConfig>(defaultWeddingConfig);
  const [lang, setLang] = useState<WeddingLang>("en");
  const [opened, setOpened] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    getTimeLeft(new Date(defaultWeddingConfig.datetime), new Date())
  );
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<"yes" | "no" | null>(null);
  const [message, setMessage] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rsvpRef = useRef<HTMLElement>(null);
  const t = copy[lang];
  const rtl = lang === "ar";
  const C = config;

  const namesLine = useMemo(
    () => ({
      groom: C.groom[lang],
      bride: C.bride[lang],
    }),
    [C.bride, C.groom, lang]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/wedding", {cache: "no-store"});
        const json = (await res.json()) as {ok?: boolean; config?: WeddingConfig};
        if (!cancelled && json.ok && json.config) {
          setConfig(json.config);
        }
      } catch {
        // keep defaults
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const tick = () => setTimeLeft(getTimeLeft(new Date(C.datetime), new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [C.datetime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;

    const tryPlay = async () => {
      if (cancelled) return;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.loop = true;
      try {
        await video.play();
      } catch {
        window.setTimeout(() => {
          if (!cancelled) void video.play().catch(() => undefined);
        }, 250);
      }
    };

    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    void tryPlay();

    return () => {
      cancelled = true;
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
    };
  }, [opened, C.video]);

  const openInvite = () => {
    setOpened(true);
    void videoRef.current?.play().catch(() => undefined);
  };

  const scrollToRsvp = () => {
    rsvpRef.current?.scrollIntoView({behavior: "smooth", block: "start"});
  };

  const submitRsvp = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !attending || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/wedding/rsvp", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          name: name.trim(),
          attending,
          message: message.trim(),
          signature,
          lang,
        }),
      });

      const status =
        attending === "yes"
          ? lang === "ar"
            ? "سأحضر"
            : "Attending"
          : lang === "ar"
            ? "لن أحضر"
            : "Not attending";
      const body = [
        `RSVP — ${C.groom.en} & ${C.bride.en}`,
        `Name: ${name.trim()}`,
        `Status: ${status}`,
        message.trim() ? `Message: ${message.trim()}` : null,
        signature ? "Signature: yes" : "Signature: no",
      ]
        .filter(Boolean)
        .join("\n");
      if (C.whatsapp) {
        window.open(`https://wa.me/${C.whatsapp}?text=${encodeURIComponent(body)}`, "_blank");
      }
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const countdownItems = [
    {label: t.days, value: timeLeft.days},
    {label: t.hours, value: timeLeft.hours},
    {label: t.minutes, value: timeLeft.minutes},
    {label: t.seconds, value: timeLeft.seconds},
  ];

  return (
    <div
      className={`wedding-invite min-h-[100svh] bg-[#fbfaf9] text-[#1c211c] ${rtl ? "rtl" : "ltr"}`}
      dir={rtl ? "rtl" : "ltr"}
      style={{
        fontFamily:
          "var(--font-wedding-sans), var(--font-wedding-arabic), Montserrat, Cairo, sans-serif",
      }}
    >
      <div className="fixed top-4 end-4 z-[80]">
        <div className="flex overflow-hidden rounded-full border border-white/40 bg-black/35 text-xs backdrop-blur-md">
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`px-3 py-1.5 transition ${lang === "en" ? "bg-white text-black" : "text-white/85"}`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLang("ar")}
            className={`px-3 py-1.5 transition ${lang === "ar" ? "bg-white text-black" : "text-white/85"}`}
          >
            عربي
          </button>
        </div>
      </div>

      {!opened && (
        <button
          type="button"
          onClick={openInvite}
          className="fixed inset-0 z-[70] flex min-h-[100svh] cursor-pointer items-center justify-center overflow-hidden border-0 bg-black p-0 text-center"
          aria-label={t.tapToOpen}
        >
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            src={C.video}
            poster={C.poster}
            playsInline
            muted
            autoPlay
            loop
            preload="auto"
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="relative z-10 px-6 text-white">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/85">{t.specialFor}</p>
            <p className="mt-3 text-lg font-light tracking-wide text-white/90">{t.guest}</p>
            <h1
              className="mt-8 text-5xl leading-none text-white md:text-6xl"
              style={{fontFamily: "var(--font-wedding-script), 'Great Vibes', cursive"}}
            >
              {namesLine.groom} &amp; {namesLine.bride}
            </h1>
            <p className="mt-8 text-[11px] uppercase tracking-[0.28em] text-white/85">{t.youreInvited}</p>
            <p className="mt-2 text-sm text-white/80">{C.occasion[lang]}</p>
            <div className="mx-auto my-6 h-px w-16 bg-white/50" />
            <p className="animate-pulse text-[11px] uppercase tracking-[0.32em] text-white/90">{t.tapToOpen}</p>
          </div>
        </button>
      )}

      {opened && (
        <div className="mx-auto min-h-[100svh] w-full max-w-xl shadow-2xl">
          <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-black">
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              src={C.video}
              poster={C.poster}
              playsInline
              muted
              autoPlay
              loop
              preload="auto"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/20 to-black/45" />
            <div className="relative z-10 flex min-h-[100svh] w-full flex-col items-center justify-between px-6 py-16 text-center text-white">
              <p className="pt-6 text-[11px] uppercase tracking-[0.28em] text-white/90">{t.married}</p>
              <div>
                <h1
                  className="text-6xl leading-none md:text-7xl"
                  style={{fontFamily: "var(--font-wedding-script), 'Great Vibes', cursive"}}
                >
                  {namesLine.groom}
                  <span className="mx-2 block text-3xl md:text-4xl">&amp;</span>
                  {namesLine.bride}
                </h1>
                <div className="mx-auto my-5 h-px w-20 bg-white/55" />
                <p
                  className="text-xl tracking-wide text-white/95 md:text-2xl"
                  style={{fontFamily: "var(--font-wedding-serif), 'Cormorant Garamond', serif"}}
                >
                  {C.dateLabel[lang]}
                </p>
              </div>
              <button
                type="button"
                onClick={scrollToRsvp}
                className="pb-4 text-[11px] uppercase tracking-[0.28em] text-white/90 transition hover:text-white"
              >
                {t.confirmAttendance}
              </button>
            </div>
          </section>

          <section className="bg-[#fbfaf9] px-6 py-16 text-center">
            <h2
              className="text-4xl text-[#1c211c]"
              style={{fontFamily: "var(--font-wedding-script), 'Great Vibes', cursive"}}
            >
              {t.countdown}
            </h2>
            <p className="mt-2 text-sm tracking-wide text-[#1c211c]/70">{t.toTheBigDay}</p>
            {timeLeft.isPast ? (
              <p className="mt-8 text-lg">{t.bigDayHere}</p>
            ) : (
              <div className="mt-10 grid grid-cols-4 gap-3">
                {countdownItems.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-black/5 bg-white px-2 py-4 shadow-sm">
                    <p
                      className="text-2xl tabular-nums md:text-3xl"
                      style={{fontFamily: "var(--font-wedding-serif), 'Cormorant Garamond', serif"}}
                    >
                      {pad(item.value)}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-black/50">{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-[#fbfaf9] px-6 pb-16 text-center">
            <h2
              className="text-4xl"
              style={{fontFamily: "var(--font-wedding-script), 'Great Vibes', cursive"}}
            >
              {t.dayDetails}
            </h2>
            <p className="mt-2 text-sm text-black/60">{t.everything}</p>

            <div className="mt-10 rounded-3xl border border-black/5 bg-white p-6 text-start shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.22em] text-black/45">{t.location}</p>
              <h3
                className="mt-2 text-2xl"
                style={{fontFamily: "var(--font-wedding-serif), 'Cormorant Garamond', serif"}}
              >
                {C.venue[lang]}
              </h3>
              <p className="mt-1 text-sm text-black/65">
                {C.city[lang]} · {C.timeLabel[lang]}
              </p>
              <div className="mt-5 overflow-hidden rounded-2xl border border-black/5 bg-[#eeeae4]">
                <iframe
                  title="Venue map"
                  className="h-48 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(`${C.venue.en}, ${C.city.en}`)}&z=15&output=embed`}
                />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={C.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-[#1c211c] px-5 py-2.5 text-sm text-white transition hover:bg-black"
                >
                  {t.openMaps}
                </a>
                <a
                  href={buildCalendarUrl(C)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm transition hover:bg-black/5"
                >
                  {t.addCalendar}
                </a>
              </div>
            </div>
          </section>

          <section ref={rsvpRef} className="bg-[#f3f0ea] px-6 py-16 text-center">
            <h2
              className="text-4xl"
              style={{fontFamily: "var(--font-wedding-script), 'Great Vibes', cursive"}}
            >
              {t.rsvpTitle}
            </h2>
            <p className="mt-2 text-sm text-black/60">{t.rsvpSub}</p>
            <div className="mx-auto my-5 text-lg text-black/35">✦</div>

            <form onSubmit={submitRsvp} className="mx-auto max-w-md space-y-5 text-start">
              <label className="block">
                <span className="mb-1.5 block text-sm text-black/70">{t.fullName}</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none ring-[#1c211c] focus:ring-2"
                />
              </label>

              <div>
                <p className="mb-2 text-sm text-black/70">{t.willYou}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setAttending("yes")}
                    className={`rounded-2xl border px-4 py-3 text-sm transition ${
                      attending === "yes"
                        ? "border-[#1c211c] bg-[#1c211c] text-white"
                        : "border-black/10 bg-white hover:bg-black/5"
                    }`}
                  >
                    {t.yes}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttending("no")}
                    className={`rounded-2xl border px-4 py-3 text-sm transition ${
                      attending === "no"
                        ? "border-[#1c211c] bg-[#1c211c] text-white"
                        : "border-black/10 bg-white hover:bg-black/5"
                    }`}
                  >
                    {t.no}
                  </button>
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm text-black/70">{t.message}</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none ring-[#1c211c] focus:ring-2"
                />
              </label>

              <SignaturePad
                label={t.signature}
                clearLabel={t.clearSignature}
                hint={t.signHere}
                onChange={setSignature}
              />

              {submitted ? (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-900">
                  {lang === "ar" ? "تم استلام تأكيدك — شكرًا لك!" : "Your RSVP was received — thank you!"}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={!name.trim() || !attending || submitting || submitted}
                className="w-full rounded-full bg-[#1c211c] px-5 py-3.5 text-sm font-medium tracking-wide text-white transition enabled:hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? (lang === "ar" ? "جاري الإرسال…" : "Sending…") : t.send}
              </button>
            </form>
          </section>

          <section className="bg-[#1c211c] px-6 py-20 text-center text-white">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/70">{t.waiting}</p>
            <h2
              className="mt-5 text-5xl"
              style={{fontFamily: "var(--font-wedding-script), 'Great Vibes', cursive"}}
            >
              {namesLine.groom} &amp; {namesLine.bride}
            </h2>
            <p
              className="mt-4 text-lg text-white/80"
              style={{fontFamily: "var(--font-wedding-serif), 'Cormorant Garamond', serif"}}
            >
              {C.dateLabel[lang]}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
