import type { Metadata } from "next";
import { Noto_Sans_Bengali, Syne } from "next/font/google";
import { LocaleProvider } from "@/lib/i18n/locale-context";
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

export const metadata: Metadata = {
  title: "BloodLink | Blood donors across Bangladesh",
  description:
    "Free humanitarian platform to find blood donors by location across Bangladesh. Secure, bilingual, and non-commercial.",
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
