import type { Metadata } from "next";
import { TenantStatsPage } from "@/components/cricket/TenantStatsPage";

export const metadata: Metadata = { title: "Tournament Stats | PitchLive" };
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TenantStatsPage slug={slug} />;
}
