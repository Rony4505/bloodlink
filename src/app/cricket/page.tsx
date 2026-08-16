import type { Metadata } from "next";
import { CricketLanding } from "@/components/cricket/CricketLanding";

export const metadata: Metadata = {
  title: "PitchLive | Cricket Live Score Rental",
  description:
    "বাংলাদেশের ক্লাব ও টুর্নামেন্টের জন্য লাইভ ক্রিকেট স্কোর + ভিডিও — সহজ স্কোরার কনসোল, রেন্ট করে চালান।",
};

export default function CricketPage() {
  return <CricketLanding />;
}
