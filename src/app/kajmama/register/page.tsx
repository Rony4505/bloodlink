import type { Metadata } from "next";
import { Suspense } from "react";
import { KmRegister } from "@/components/kajmama/KmAuth";

export const metadata: Metadata = { title: "অ্যাকাউন্ট" };

export default function KajmamaRegisterPage() {
  return (
    <Suspense>
      <KmRegister />
    </Suspense>
  );
}
