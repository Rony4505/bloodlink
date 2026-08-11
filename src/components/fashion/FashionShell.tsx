import { FashionFooter } from "./FashionFooter";
import { FashionHeader } from "./FashionHeader";
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
    <div className="flex min-h-screen flex-col bg-[#f7f7f5] text-[#241815]">
      <TopLanguageBar />
      <ChatSupportWidget />
      <SiteEntryPopup />
      <div className={headerVariant === "dark" ? "bg-transparent" : "border-b border-black/5 bg-[#f7f7f5] px-5 py-5 md:px-8"}>
        <div className="mx-auto max-w-7xl">
          <FashionHeader variant={headerVariant} />
        </div>
      </div>
      <div className="flex-1">{children}</div>
      <FashionFooter />
    </div>
  );
}
