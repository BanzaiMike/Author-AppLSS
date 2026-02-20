import type { Metadata } from "next";
import { Noto_Serif_Display, Noto_Sans_Display, Merriweather } from "next/font/google";
import "./globals.css";

const notoSerifDisplay = Noto_Serif_Display({
  variable: "--_font-heading",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const notoSansDisplay = Noto_Sans_Display({
  variable: "--_font-body",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const merriweather = Merriweather({
  variable: "--_font-nav",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Author App",
  description: "Author App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${notoSerifDisplay.variable} ${notoSansDisplay.variable} ${merriweather.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
