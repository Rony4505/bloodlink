import type { Metadata } from "next";
import { FashionHomePage } from "@/components/FashionHomePage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Smart craft corner | Luxury Womenswear for Bangladesh",
  description:
    "Smart craft corner is a luxury yet effortless women's fashion destination for Bangladesh, featuring premium festive and everyday edits with nationwide delivery.",
  alternates: {
    canonical: "/shop",
  },
};

export default async function ShopHomePage() {
  return <FashionHomePage />;
}
