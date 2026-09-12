import type { Metadata } from "next";
import { Suspense } from "react";
import { KmJobNew } from "@/components/kajmama/KmJobs";

export const metadata: Metadata = { title: "নতুন কাজ" };

export default function KajmamaJobNewPage() {
  return (
    <Suspense>
      <KmJobNew />
    </Suspense>
  );
}
