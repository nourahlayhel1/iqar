import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { MainNav } from "@/components/main-nav";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const bodyFont = Inter({ subsets: ["latin"], variable: "--font-body" });
const displayFont = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://iqar-swxy.vercel.app";
const marketingDescription =
  "Discover exceptional properties and extraordinary living with a curated luxury real estate portfolio, discreet advisory, and fast property requests.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "IQAR Signature Properties | Exceptional Properties",
    template: "%s | IQAR Signature Properties"
  },
  description: marketingDescription,
  applicationName: "IQAR Signature Properties",
  keywords: [
    "luxury real estate",
    "exclusive properties",
    "premium residences",
    "property advisory",
    "Lebanon real estate",
    "Dubai real estate"
  ],
  authors: [{ name: "IQAR Signature Properties" }],
  creator: "IQAR Signature Properties",
  publisher: "IQAR Signature Properties",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "IQAR Signature Properties",
    title: "Exceptional Properties. Extraordinary Living.",
    description: marketingDescription,
    images: [
      {
        url: "/assets/brand/LuxuryRealEstateBranding.webp",
        width: 1534,
        height: 512,
        alt: "Luxury modern villa with pool at sunset"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Exceptional Properties. Extraordinary Living.",
    description: marketingDescription,
    images: ["/assets/brand/LuxuryRealEstateBranding.webp"]
  },
  robots: {
    index: true,
    follow: true
  }
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
