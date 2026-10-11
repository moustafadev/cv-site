import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {NextIntlClientProvider} from "next-intl";
import {getMessages, setRequestLocale} from "next-intl/server";
import {LanguageSwitcher} from "@/components/LanguageSwitcher";
import {Analytics} from "@/components/Analytics";
import {CvViewTracker} from "@/components/CvViewTracker";
import {ProfileAvatar} from "@/components/ProfileAvatar";
import {RootDocument} from "@/components/RootDocument";
import {SiteNav} from "@/components/SiteNav";
import {isLocale, localePath, locales} from "@/i18n/routing";
import {SITE_ICONS} from "@/lib/site";

export const metadata: Metadata = {icons: SITE_ICONS};

/** Root layout for the public site: <html lang> follows the locale (en at /, ru at /ru). */
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
  const home = localePath(locale);

  return (
    <RootDocument lang={locale}>
      <NextIntlClientProvider messages={messages}>
        <CvViewTracker locale={locale} />
        <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur-xl">
          <div className="container-page flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <ProfileAvatar locale={locale} />
              <a href={home} className="font-display text-lg font-semibold text-white">
                Mostafa Omar
              </a>
            </div>
            <nav className="flex items-center gap-3">
              <SiteNav />
              <LanguageSwitcher />
              <a
                href={`${home}#contact`}
                className="hidden rounded-full bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 md:inline-flex"
              >
                {locale === "ru" ? "Связаться" : "Let’s connect"}
              </a>
            </nav>
          </div>
        </header>
        {children}
        <Analytics />
      </NextIntlClientProvider>
    </RootDocument>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}
