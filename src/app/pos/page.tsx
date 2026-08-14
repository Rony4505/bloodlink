import type { Metadata } from "next";
import { MudidokanPos } from "@/components/mudidokan/MudidokanPos";

export const metadata: Metadata = {
  title: "মুদি দোকান POS | সহজ বিক্রি সিস্টেম",
  description:
    "বাংলাদেশের মুদি দোকানের জন্য সহজ পয়েন্ট অফ সেল — পণ্য বিক্রি, বিল, রসিদ ও দৈনিক হিসাব।",
  robots: { index: false, follow: false },
};

export default function PosPage() {
  return <MudidokanPos />;
}
