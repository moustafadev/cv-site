import type {Metadata} from "next";
import "./globals.css";
import {clashDisplay, generalSans, onest} from "./fonts";

export const metadata: Metadata = {
  icons: {
    icon: [{url: "/profile-mostafa.png", type: "image/png"}],
    shortcut: "/profile-mostafa.png",
    apple: "/profile-mostafa.png"
  }
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${clashDisplay.variable} ${generalSans.variable} ${onest.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html: "document.documentElement.classList.add('js')"}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
