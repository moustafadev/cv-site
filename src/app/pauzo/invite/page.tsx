import type {Metadata} from "next";
import {headers} from "next/headers";
import {normalizeCode} from "@/lib/pauzo";
import {CopyCode} from "./CopyCode";

/**
 * Landing page for a shared invite link. With Pauzo installed, Android App
 * Links / iOS Universal Links open the app on this URL before the page
 * loads; otherwise this page sends the friend to the store with the code
 * (on Android the Play install referrer hands it to the app after install).
 */

const PACKAGE = process.env.PAUZO_ANDROID_PACKAGE?.trim() || "com.pauzo.app";

const COPY = {
  ar: {
    dir: "rtl",
    title: "صاحبك عزمك على Pauzo",
    body: "نزّل Pauzo وادخل بالكود ده، وتتفتحوا انتوا الاتنين للأبد.",
    code: "الكود",
    play: "نزّله من Google Play",
    appStore: "نزّله من App Store",
    copy: "انسخ الكود",
    copied: "اتنسخ",
    steps: ["نزّل التطبيق", "افتح «كود الدعوة» ← «عندي كود»", "اكتب الكود، وخلاص"],
    invalid: "اللينك ده ناقص الكود. اطلب من صاحبك يبعته تاني."
  },
  ru: {
    dir: "ltr",
    title: "Друг пригласил вас в Pauzo",
    body: "Установите Pauzo и введите этот код — и приложение откроется у вас обоих навсегда.",
    code: "Код",
    play: "Скачать в Google Play",
    appStore: "Скачать в App Store",
    copy: "Скопировать код",
    copied: "Скопировано",
    steps: ["Установите приложение", "Откройте «Код приглашения» → «У меня есть код»", "Введите код — готово"],
    invalid: "В ссылке нет кода. Попросите друга отправить её ещё раз."
  },
  en: {
    dir: "ltr",
    title: "A friend invited you to Pauzo",
    body: "Install Pauzo and enter this code — the app unlocks for both of you, for good.",
    code: "Code",
    play: "Get it on Google Play",
    appStore: "Download on the App Store",
    copy: "Copy code",
    copied: "Copied",
    steps: ["Install the app", "Open «Invite code» → «I have a code»", "Enter the code — done"],
    invalid: "This link is missing its code. Ask your friend to send it again."
  }
} as const;

export const metadata: Metadata = {
  title: "Pauzo — invite",
  description: "Join Pauzo with a friend's code.",
  openGraph: {title: "Pauzo — you're invited", description: "Join Pauzo with a friend's code and you both unlock it."}
};

export default async function InvitePage({searchParams}: {searchParams: Promise<{code?: string}>}) {
  const {code: raw} = await searchParams;
  const code = normalizeCode(raw ?? "");
  const lang = ((await headers()).get("accept-language") ?? "").toLowerCase();
  const t = lang.startsWith("ar") ? COPY.ar : lang.startsWith("ru") ? COPY.ru : COPY.en;
  const playUrl =
    `https://play.google.com/store/apps/details?id=${PACKAGE}` +
    (code ? `&referrer=${encodeURIComponent(`pauzo_code=${code}`)}` : "");
  const appStoreUrl = process.env.PAUZO_IOS_APP_URL?.trim();

  return (
    <main dir={t.dir} className="flex min-h-screen items-center justify-center bg-[#0D123D] px-4 py-12 text-white">
      <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-[#8056D8] to-[#6C35F4] p-7 shadow-2xl">
        <p className="text-lg font-bold tracking-tight">Pauzo</p>
        <h1 className="mt-6 text-2xl font-extrabold leading-snug">{t.title}</h1>
        <p className="mt-2 text-sm text-white/80">{code ? t.body : t.invalid}</p>

        {code ? (
          <>
            <div className="mt-6 rounded-2xl bg-white/10 p-5 text-center">
              <p className="text-xs uppercase tracking-widest text-white/70">{t.code}</p>
              <p dir="ltr" className="mt-1 font-mono text-4xl font-extrabold tracking-wider">
                {code}
              </p>
              <div className="mt-4">
                <CopyCode code={code} label={t.copy} done={t.copied} />
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <a
                href={playUrl}
                className="rounded-2xl bg-[#FF8A1F] px-5 py-3.5 text-center text-base font-semibold text-white hover:brightness-110"
              >
                {t.play}
              </a>
              {appStoreUrl ? (
                <a
                  href={appStoreUrl}
                  className="rounded-2xl border border-white/40 px-5 py-3.5 text-center text-base font-semibold text-white hover:border-white"
                >
                  {t.appStore}
                </a>
              ) : null}
            </div>

            <ol className="mt-6 space-y-1.5 text-sm text-white/80">
              {t.steps.map((step, i) => (
                <li key={step}>
                  {i + 1}. {step}
                </li>
              ))}
            </ol>
          </>
        ) : null}
      </div>
    </main>
  );
}
