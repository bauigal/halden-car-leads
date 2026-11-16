import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import type { ReactNode } from "react";

import { copy } from "@/content/copy";

import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: copy.meta.title,
  description: copy.meta.description,
};

export const viewport: Viewport = {
  themeColor: "#f3efe6",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB" className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#valuation"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md"
        >
          {copy.skip}
        </a>
        {children}
      </body>
    </html>
  );
}
