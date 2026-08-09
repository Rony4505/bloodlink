import type { Metadata } from "next";
import { Noto_Sans_Bengali, Syne } from "next/font/google";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = Noto_Sans_Bengali({
  variable: "--font-body",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
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
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/bloodlink-logo.png",
    apple: "/bloodlink-logo.png",
  },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    url: siteUrl,
    siteName: "BloodLink BD",
    title: "BloodLink BD | Bangladesh Blood Donor Finder",
    description:
      "Find blood donors across Bangladesh by blood group and location.",
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
    description:
      "Find blood donors across Bangladesh by blood group and location.",
    images: ["/bloodlink-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bn" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
