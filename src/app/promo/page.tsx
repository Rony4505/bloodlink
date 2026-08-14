import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PromoExperience } from "@/components/promo/PromoExperience";
import { isBloodlinkMode } from "@/lib/app-mode";
import "./promo.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cinematic Promo",
  description:
    "BloodLink BD — রক্তের প্রয়োজনে, মানুষের পাশে। Connect. Donate. Save a Life.",
  robots: { index: true, follow: true },
};

export default function PromoPage() {
  if (!isBloodlinkMode()) notFound();

  return <PromoExperience />;
}
