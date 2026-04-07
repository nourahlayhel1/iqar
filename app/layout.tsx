import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const bodyFont = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body" });
const displayFont = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "IQAR Signature Properties",
  description: "Single-page luxury property discovery experience built on the existing Next.js data layer."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <div className="page-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
