import { FashionFooter } from "./FashionFooter";
import { FashionHeader } from "./FashionHeader";
import { OrderBottomNav } from "./OrderBottomNav";
import { SiteEntryPopup } from "./SiteEntryPopup";
import { TopLanguageBar } from "./LanguageSwitcher";
import { ChatSupportWidget } from "./ChatSupportWidget";

export function FashionShell({
  children,
  headerVariant = "light",
}: {
  children: React.ReactNode;
  headerVariant?: "light" | "dark";
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[linear-gradient(165deg,#f0e8df_0%,#e8ddd2_38%,#dfd2c4_100%)] pb-20 text-[#241815] md:pb-0">
      <TopLanguageBar />
      <ChatSupportWidget />
      <SiteEntryPopup />
      <div className={headerVariant === "dark" ? "bg-transparent" : "border-b border-black/5 bg-[linear-gradient(180deg,#f0e8df_0%,#ebe2d8_100%)] px-5 py-5 md:px-8"}>
        <div className="mx-auto max-w-7xl">
          <FashionHeader variant={headerVariant} />
        </div>
      </div>
      <div className="flex-1">{children}</div>
      <FashionFooter />
      <OrderBottomNav />
    </div>
  );
}
