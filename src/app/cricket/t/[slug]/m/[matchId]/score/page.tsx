import type { Metadata } from "next";
import { ScorerPageClient } from "@/components/cricket/ScorerPageClient";

type Props = { params: Promise<{ slug: string; matchId: string }> };

export const metadata: Metadata = {
  title: "Scorer Console | PitchLive",
  robots: { index: false, follow: false },
};

export default async function ScorerPage({ params }: Props) {
  const { slug, matchId } = await params;
  return <ScorerPageClient slug={slug} matchId={matchId} />;
}
