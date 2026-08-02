import type {Metadata} from "next";
import {headers} from "next/headers";
import {
  Cairo,
  Cormorant_Garamond,
  Great_Vibes,
  Montserrat,
} from "next/font/google";
import {WeddingInvite} from "@/components/WeddingInvite";

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

const TITLE = "Mostafa & Wafaa — Wedding Invitation";
const DESCRIPTION = "You're invited to celebrate with us on 16.8.2026";
const OG_IMAGE_PATH = "/wedding/og-preview.jpg";

async function getSiteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!host) return "http://localhost:3000";

  const proto = headerStore.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const origin = await getSiteOrigin();
  const imageUrl = `${origin}${OG_IMAGE_PATH}`;

  return {
    metadataBase: new URL(origin),
    title: TITLE,
    description: DESCRIPTION,
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: `${origin}/wedding`,
      siteName: "Mostafa & Wafaa",
      type: "website",
      locale: "en_US",
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          width: 704,
          height: 894,
          type: "image/jpeg",
          alt: "Mostafa & Wafaa — 16.8.2026",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
      images: [imageUrl],
    },
    other: {
      "og:image:width": "704",
      "og:image:height": "894",
    },
  };
}

export default function WeddingPage() {
  return (
    <div
      className={`${script.variable} ${serif.variable} ${sans.variable} ${arabic.variable}`}
      style={{fontFamily: "var(--font-wedding-sans), var(--font-wedding-arabic), sans-serif"}}
    >
      <WeddingInvite />
    </div>
  );
}
