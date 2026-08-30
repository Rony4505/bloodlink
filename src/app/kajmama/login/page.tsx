import type { Metadata } from "next";
import { KmLogin } from "@/components/kajmama/KmAuth";

export const metadata: Metadata = { title: "লগইন" };

export default function KajmamaLoginPage() {
  return <KmLogin />;
}
