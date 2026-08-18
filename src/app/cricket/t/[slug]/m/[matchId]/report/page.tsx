import type { Metadata } from "next";
import { MatchReportPage } from "@/components/cricket/MatchReportPage";

export const metadata: Metadata = { title: "Match Report | PitchLive", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ slug: string; matchId: string }> }) {
  const { slug, matchId } = await params;
  return <MatchReportPage slug={slug} matchId={matchId} />;
}
