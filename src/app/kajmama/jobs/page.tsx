import type { Metadata } from "next";
import { KmJobs } from "@/components/kajmama/KmJobs";

export const metadata: Metadata = { title: "কাজ" };

export default function KajmamaJobsPage() {
  return <KmJobs />;
}
