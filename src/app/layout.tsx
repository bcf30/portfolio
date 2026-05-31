import type { Metadata } from "next";
import { Noto_Sans_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import FilmEffect from "@/components/FilmEffect";

/* Optimized Monospace Font for a clean screenplay / technical catalog look */
const notoSansMono = Noto_Sans_Mono({
  variable: "--font-noto-sans-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ramiro Chen | Portfolio",
  description: "Ramiro Chen's portfolio. Inspired by several filmmakers I look fondly to",
  keywords: [
    "portfolio", 
    "cinema", 
    "Apichatpong Weerasethakul", 
    "Charlie Kaufman", 
    "Wang Bing",
    "slow cinema",
    "audiophile",
    "IEM",
    "frequency response",
    "film studies",
    "Counter-Strike"
  ],
  authors: [{ name: "Ramiro Chen" }],

  openGraph: {
    title: "Ramiro Chen | Portfolio",
    description: "Ramiro Chen's portfolio. Inspired by several filmmakers I look fondly to",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ramiro Chen",
    description: "Ramiro Chen's portfolio",
  },
  icons: {
    icon: "/images/icon/buffalofav.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        <style dangerouslySetInnerHTML={{ __html: `
          html, body { background: oklch(0.16 0.01 145) !important; }
          * { scrollbar-width: none !important; }
          ::-webkit-scrollbar { display: none !important; }
        ` }} />
      </head>
      <body className={`${notoSansMono.variable} antialiased`}>
        <FilmEffect />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
