import type { Metadata } from "next";
import { MatchPageClient } from "@/components/cricket/MatchPageClient";

type Props = { params: Promise<{ slug: string; matchId: string }> };

export const metadata: Metadata = {
  title: "Live Match | PitchLive",
  description: "লাইভ স্কোর + ভিডিও",
};

export default async function MatchPage({ params }: Props) {
  const { slug, matchId } = await params;
  return <MatchPageClient slug={slug} matchId={matchId} />;
}
