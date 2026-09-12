import type { Metadata } from "next";
import { Suspense } from "react";
import { KmWorkers } from "@/components/kajmama/KmWorkers";

export const metadata: Metadata = { title: "ওয়ার্কার" };

export default function KajmamaWorkersPage() {
  return (
    <Suspense>
      <KmWorkers />
    </Suspense>
  );
}
