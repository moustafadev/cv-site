import type {Metadata} from "next";
import {RootDocument} from "@/components/RootDocument";
import {SITE_ICONS} from "@/lib/site";

export const metadata: Metadata = {
  title: "Pauzo",
  icons: SITE_ICONS,
  robots: {index: false, follow: false}
};

export default function PauzoLayout({children}: {children: React.ReactNode}) {
  return <RootDocument lang="en">{children}</RootDocument>;
}
