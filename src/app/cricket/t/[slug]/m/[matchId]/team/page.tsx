import type { Metadata } from "next";
import { TeamSheetEditor } from "@/components/cricket/TeamSheetEditor";

type Props = { params: Promise<{ slug: string; matchId: string }> };

export const metadata: Metadata = {
  title: "Team List | PitchLive",
  robots: { index: false, follow: false },
};

export default async function TeamSheetPage({ params }: Props) {
  const { slug, matchId } = await params;
  return <TeamSheetEditor slug={slug} matchId={matchId} />;
}
