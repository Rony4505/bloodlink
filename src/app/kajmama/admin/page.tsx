import type { Metadata } from "next";
import { KmAdmin } from "@/components/kajmama/KmAdmin";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function KajmamaAdminPage() {
  return <KmAdmin />;
}
