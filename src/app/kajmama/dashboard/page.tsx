import type { Metadata } from "next";
import { KmDashboard } from "@/components/kajmama/KmDashboard";

export const metadata: Metadata = { title: "ড্যাশবোর্ড" };

export default function KajmamaDashboardPage() {
  return <KmDashboard />;
}
