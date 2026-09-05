import type { Metadata } from "next";
import { KmBlog } from "@/components/kajmama/KmBlog";

export const metadata: Metadata = { title: "ব্লগ" };

export default function KajmamaBlogPage() {
  return <KmBlog />;
}
