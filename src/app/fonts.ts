import localFont from "next/font/local";
import {Onest} from "next/font/google";

// Clash Display + General Sans (Fontshare, ITF Free Font License) are Latin-only;
// Onest covers Cyrillic, so Russian text falls back to it glyph by glyph.
export const clashDisplay = localFont({
  src: [
    {path: "../fonts/ClashDisplay-500.woff2", weight: "500"},
    {path: "../fonts/ClashDisplay-600.woff2", weight: "600"},
    {path: "../fonts/ClashDisplay-700.woff2", weight: "700"}
  ],
  variable: "--font-clash",
  display: "swap"
});

export const generalSans = localFont({
  src: [
    {path: "../fonts/GeneralSans-400.woff2", weight: "400"},
    {path: "../fonts/GeneralSans-500.woff2", weight: "500"},
    {path: "../fonts/GeneralSans-600.woff2", weight: "600"}
  ],
  variable: "--font-general",
  display: "swap"
});

export const onest = Onest({subsets: ["latin", "cyrillic"], variable: "--font-onest", display: "swap"});
