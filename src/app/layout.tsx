import type {Metadata} from "next";
import "./globals.css";

export const metadata: Metadata = {
  icons: {
    icon: [{url: "/profile-mostafa.png", type: "image/png"}],
    shortcut: "/profile-mostafa.png",
    apple: "/profile-mostafa.png"
  }
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
