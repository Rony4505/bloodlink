import type { Metadata } from "next";
import { BloodLinkAboutPage } from "@/components/BloodLinkAboutPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return <BloodLinkAboutPage />;
}
