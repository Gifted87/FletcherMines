import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fletcher Mines — Institutional Mining Blocks & Structured Yields",
  description:
    "Purchase mining blocks backed by physical mining infrastructure. Select a maturity term from 14 to 180 days with fixed daily earning rates from 10% to 20% per day. Limited allocation per batch.",
};

export const viewport: Viewport = {
  themeColor: "#0a0e15",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
