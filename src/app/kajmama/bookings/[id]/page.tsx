import type { Metadata } from "next";
import { KmBooking } from "@/components/kajmama/KmBooking";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `বুকিং · ${id}` };
}

export default function KajmamaBookingPage() {
  return <KmBooking />;
}
