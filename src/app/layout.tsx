import type { Metadata } from "next";
import { Noto_Sans_Bengali, Syne } from "next/font/google";
import { SiteAppearanceProvider } from "@/components/SiteAppearanceProvider";
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
    default: "Nooré Dhaka | Luxury Womenswear for Bangladesh",
    template: "%s | Nooré Dhaka",
  },
  description:
    "Nooré Dhaka is a luxury yet effortless women's fashion destination for Bangladesh, featuring premium festive and everyday edits with nationwide delivery.",
  keywords: [
    "Nooré Dhaka",
    "Bangladesh womens fashion",
    "luxury ecommerce Bangladesh",
    "ladies boutique Dhaka",
    "women's clothing Bangladesh",
    "মেয়েদের অনলাইন শপ",
    "লাক্সারি ফ্যাশন বাংলাদেশ",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    url: siteUrl,
    siteName: "Nooré Dhaka",
    title: "Nooré Dhaka | Luxury Womenswear for Bangladesh",
    description:
      "Premium women's fashion, festive edits, and simple luxury shopping for Bangladesh.",
    images: [
      {
        url: "/bloodlink-logo.png",
        width: 512,
        height: 512,
        alt: "Nooré Dhaka brand image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nooré Dhaka | Luxury Womenswear for Bangladesh",
    description:
      "Premium women's fashion, festive edits, and simple luxury shopping for Bangladesh.",
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
        <LocaleProvider>
          <SiteAppearanceProvider>{children}</SiteAppearanceProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
