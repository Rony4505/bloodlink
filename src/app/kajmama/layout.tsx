import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { KmProvider } from "@/components/kajmama/KmSession";
import { KmShell } from "@/components/kajmama/KmShell";

const kmDisplay = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-km-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    absolute: "KajMama BD | বিশ্বস্ত মিস্ত্রি খুঁজুন",
    template: "%s | KajMama BD",
  },
  description:
    "KajMama BD — বাংলাদেশে বিশ্বস্ত মিস্ত্রি হায়ার করুন। ইলেকট্রিশিয়ান, প্লাম্বার, ক্লিনিং, এসি, ড্রাইভার ও আরও।",
  applicationName: "KajMama BD",
  robots: { index: true, follow: true },
};

export default function KajmamaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={kmDisplay.variable}>
      <KmProvider>
        <KmShell>{children}</KmShell>
      </KmProvider>
    </div>
  );
}
