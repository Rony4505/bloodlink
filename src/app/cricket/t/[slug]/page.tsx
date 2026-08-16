import type { Metadata } from "next";
import { TenantHome } from "@/components/cricket/TenantHome";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug} | PitchLive`,
    description: "লাইভ ক্রিকেট স্কোর ও ম্যাচ তালিকা",
  };
}

export default async function TenantPage({ params }: Props) {
  const { slug } = await params;
  return <TenantHome slug={slug} />;
}
