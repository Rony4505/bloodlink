import type { Metadata } from "next";
import { KmWorkerProfile } from "@/components/kajmama/KmWorkerProfile";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `ওয়ার্কার · ${id}` };
}

export default function KajmamaWorkerPage() {
  return <KmWorkerProfile />;
}
