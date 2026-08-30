import type { Metadata } from "next";
import { KmJobDetail } from "@/components/kajmama/KmJobs";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `কাজ · ${id}` };
}

export default function KajmamaJobDetailPage() {
  return <KmJobDetail />;
}
