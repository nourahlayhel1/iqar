import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import { MainNav } from "@/components/main-nav";

const displayFont = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: "Atlas Estate Office",
  description: "Real estate office MVP built with Next.js and JSON file persistence."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={displayFont.className}>
        <div className="page-shell">
          <header className="topbar">
            <div className="brand">
              <span className="brand-title">Atlas Estate Office</span>
              <span className="brand-subtitle">Properties, clients, and matching requests in one workflow.</span>
            </div>
            <MainNav />
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
