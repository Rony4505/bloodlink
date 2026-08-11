import { HomePage } from "@/components/HomePage";
import { FashionHomePage } from "@/components/FashionHomePage";
import { isFashionMode } from "@/lib/app-mode";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (isFashionMode()) {
    return <FashionHomePage />;
  }
  return <HomePage />;
}
