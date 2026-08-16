import type { Metadata } from "next";
import { OwnerAdmin } from "@/components/cricket/OwnerAdmin";

export const metadata: Metadata = {
  title: "PitchLive Admin | রেন্ট ম্যানেজমেন্ট",
  robots: { index: false, follow: false },
};

export default function CricketAdminPage() {
  return <OwnerAdmin />;
}
