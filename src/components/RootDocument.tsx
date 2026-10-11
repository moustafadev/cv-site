import "@/app/globals.css";
import {clashDisplay, generalSans, onest} from "@/app/fonts";

/**
 * The <html>/<body> shell shared by every root layout ([locale], admin, wedding), so `lang` can follow the locale.
 * The inline script flags JS before paint; the scroll-reveal CSS only hides content under html.js.
 */
export function RootDocument({lang, children}: {lang: string; children: React.ReactNode}) {
  return (
    <html lang={lang} className={`${clashDisplay.variable} ${generalSans.variable} ${onest.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html: "document.documentElement.classList.add('js')"}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
