import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { MainNav } from "@/components/main-nav";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const bodyFont = Inter({ subsets: ["latin"], variable: "--font-body" });
const displayFont = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "IQAR Signature Properties",
  description: "Single-page luxury property discovery experience built on the existing Next.js data layer."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <MainNav />
        <div className="page-shell">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
