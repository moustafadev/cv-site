import {notFound} from "next/navigation";
import {setRequestLocale} from "next-intl/server";
import {
  Cairo,
  Cormorant_Garamond,
  Great_Vibes,
  Montserrat,
} from "next/font/google";
import {WeddingInvite} from "@/components/WeddingInvite";
import {isLocale} from "@/i18n/routing";

const script = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-wedding-script",
  display: "swap",
});

const serif = Cormorant_Garamond({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-wedding-serif",
  display: "swap",
});

const sans = Montserrat({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-wedding-sans",
  display: "swap",
});

const arabic = Cairo({
  weight: ["300", "400", "500", "600"],
  subsets: ["arabic", "latin"],
  variable: "--font-wedding-arabic",
  display: "swap",
});

export default async function WeddingInvitationPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  return (
    <div
      className={`${script.variable} ${serif.variable} ${sans.variable} ${arabic.variable}`}
      style={{fontFamily: "var(--font-wedding-sans), var(--font-wedding-arabic), sans-serif"}}
    >
      <WeddingInvite />
    </div>
  );
}
