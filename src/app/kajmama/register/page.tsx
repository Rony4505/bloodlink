import type { Metadata } from "next";
import { KmRegister } from "@/components/kajmama/KmAuth";

export const metadata: Metadata = { title: "অ্যাকাউন্ট" };

export default function KajmamaRegisterPage() {
  return <KmRegister />;
}
