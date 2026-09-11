import { HomePage } from "@/components/HomePage";
import { FashionHomePage } from "@/components/FashionHomePage";
import { resolveAppMode } from "@/lib/app-mode";

export const dynamic = "force-dynamic";

export default async function Home() {
  if ((await resolveAppMode()) === "fashion") {
    return <FashionHomePage />;
  }
  return <HomePage />;
}
