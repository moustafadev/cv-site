import "../globals.css";
import {notFound} from "next/navigation";
import {NextIntlClientProvider} from "next-intl";
import {getMessages, setRequestLocale} from "next-intl/server";
import {LanguageSwitcher} from "@/components/LanguageSwitcher";
import {Analytics} from "@/components/Analytics";
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
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
            <div className="container-page flex items-center justify-between py-3">
              <a href={`/${locale}`} className="font-semibold text-brand-100">
                Mostafa Omar
              </a>
              <LanguageSwitcher />
            </div>
          </header>
          {children}
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}
