import {notFound} from "next/navigation";
import {NextIntlClientProvider} from "next-intl";
import {getMessages, setRequestLocale} from "next-intl/server";
import {LanguageSwitcher} from "@/components/LanguageSwitcher";
import {Analytics} from "@/components/Analytics";
import {CvViewTracker} from "@/components/CvViewTracker";
import {ProfileAvatar} from "@/components/ProfileAvatar";
import {isLocale, locales} from "@/i18n/routing";

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <CvViewTracker locale={locale} />
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
        <div className="container-page flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <ProfileAvatar locale={locale} />
            <a href={`/${locale}`} className="font-semibold text-brand-100">
              Mostafa Omar
            </a>
          </div>
          <LanguageSwitcher />
        </div>
      </header>
      {children}
      <Analytics />
    </NextIntlClientProvider>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}
