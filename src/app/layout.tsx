import type { Metadata } from "next";
import { Noto_Sans_Bengali, Syne } from "next/font/google";
import { INTRO_BOOT_SCRIPT, IntroSplash } from "@/components/IntroSplash";
import { PwaRegister } from "@/components/PwaRegister";
import { SoftSitePushAsk } from "@/components/SoftSitePushAsk";
import { SiteAppearanceProvider } from "@/components/SiteAppearanceProvider";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
  preload: true,
});

const body = Noto_Sans_Bengali({
  variable: "--font-body",
  subsets: ["bengali", "latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: true,
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BloodLink BD | Bangladesh Blood Donor Finder",
    template: "%s | BloodLink BD",
  },
  description:
    "BloodLink BD helps people in Bangladesh find blood donors by blood group and location. Post urgent needs, check availability, and connect securely.",
  keywords: [
    "BloodLink",
    "BloodLink BD",
    "blood donor Bangladesh",
    "blood donation",
    "রক্তদাতা",
    "রক্তদান",
    "bloodlinkbd.org",
  ],
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/icon", type: "image/png", sizes: "64x64" },
      { url: "/bloodlink/favicon.ico", sizes: "any" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon", type: "image/png", sizes: "180x180" },
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/icon"],
  },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    url: siteUrl,
    siteName: "BloodLink BD",
    title: "BloodLink BD | Bangladesh Blood Donor Finder",
    description: "Find blood donors across Bangladesh by blood group and location.",
    images: [
      {
        url: "/bloodlink-logo.png",
        width: 512,
        height: 512,
        alt: "BloodLink BD logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BloodLink BD | Bangladesh Blood Donor Finder",
    description: "Find blood donors across Bangladesh by blood group and location.",
    images: ["/bloodlink-logo.png"],
  },
  appleWebApp: {
    capable: true,
    title: "BloodLink BD",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  other: {
    "mobile-web-app-capable": "yes",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bn" className={`${display.variable} ${body.variable} h-full`}>
      <head>
        <meta name="theme-color" content="#1c0a0c" />
        <meta name="application-name" content="BloodLink BD" />
        <script dangerouslySetInnerHTML={{ __html: INTRO_BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <IntroSplash />
        <LocaleProvider>
          <SiteAppearanceProvider>
            <PwaRegister />
            <SoftSitePushAsk />
            {children}
          </SiteAppearanceProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
