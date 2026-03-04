import type { Metadata } from "next";
import { Cormorant_Garamond, Crimson_Text } from "next/font/google";
import "./globals.css";

/* Display font - elegant, editorial */
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

/* Body font - readable, warm, literary */
const crimson = Crimson_Text({
  variable: "--font-crimson",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
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
    "social justice",
    "FOSS",
    "Street Fighter",
    "Counter-Strike"
  ],
  authors: [{ name: "Ramiro Chen" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Ramiro Chen | Portfolio",
    description: "Ramiro Chen's portfolio. Inspired by several filmmakers I look fondly to",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ramiro Chen",
    description: "A portfolio in slow motion",
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
        <style dangerouslySetInnerHTML={{ __html: `
          html, body { background: oklch(0.16 0.01 145) !important; }
          * { scrollbar-width: none !important; }
          ::-webkit-scrollbar { display: none !important; }
        ` }} />
      </head>
      <body className={`${cormorant.variable} ${crimson.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
