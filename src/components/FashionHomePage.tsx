import { FashionFooter } from "@/components/fashion/FashionFooter";
import { FashionHeader } from "@/components/fashion/FashionHeader";
import { HomeProductBrowse } from "@/components/fashion/HomeProductBrowse";
import {
  HomeHeroActions,
  HomeLowerSections,
  HomeStatsStrip,
} from "@/components/fashion/HomeLocalized";
import { PromoCarousel } from "@/components/fashion/PromoCarousel";
import { TopLanguageBar } from "@/components/fashion/LanguageSwitcher";
import { ChatSupportWidget } from "@/components/fashion/ChatSupportWidget";
import { AnnouncementBar } from "@/components/fashion/AnnouncementBar";
import { SiteEntryPopup } from "@/components/fashion/SiteEntryPopup";
import { buildCarouselSlides } from "@/lib/fashion/carousel-slides";
import { getCategories } from "@/lib/fashion/categories-server";
import {
  getActiveOffers,
  getActivePromoBanners,
  getNewProducts,
  getStoreSettings,
  listProducts,
  listPublicCoupons,
} from "@/lib/fashion/store";

export async function FashionHomePage() {
  const [offers, newProducts, settings, banners, coupons, categories, products] =
    await Promise.all([
      getActiveOffers(),
      getNewProducts(14),
      getStoreSettings(),
      getActivePromoBanners(),
      listPublicCoupons(),
      getCategories(),
      listProducts(),
    ]);

  const carouselSlides = buildCarouselSlides(banners);
  const displayCoupons = settings.showCouponsOnHome !== false ? coupons : [];

  return (
    <main className="min-h-screen bg-[#faf8f6] text-[#4a3348]">
      <TopLanguageBar />
      <ChatSupportWidget />
      <SiteEntryPopup />
      <AnnouncementBar settings={settings} />
      <section className="relative overflow-hidden border-b border-[#e8d4e8]/40 bg-[radial-gradient(ellipse_at_12%_8%,rgba(255,240,248,0.85),transparent_52%),radial-gradient(ellipse_at_92%_92%,rgba(243,228,216,0.75),transparent_48%),linear-gradient(135deg,#fdf8f5_0%,#f5e8f0_38%,#ebe0f5_72%,#f8efe8_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.55),transparent_45%,rgba(255,248,252,0.35)_100%)]" />
        <div className="hero-orb pointer-events-none absolute -left-16 top-24 h-72 w-72 rounded-full bg-[#e8c4d8]/30 blur-3xl" />
        <div className="hero-drift pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#f0d4c2]/35 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-14 md:px-8 md:pb-24 md:pt-16">
          <FashionHeader variant="light" />

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/15 shadow-lg">
            <PromoCarousel slides={carouselSlides} coupons={displayCoupons} products={products} />
          </div>

          <HomeHeroActions settings={settings} />
        </div>
      </section>

      <HomeProductBrowse
        categories={categories}
        products={products}
        newProducts={newProducts}
        offerProducts={offers}
        showNewProducts={settings.showNewProducts !== false}
        showOffers={settings.showOffers !== false}
      />

      <HomeStatsStrip settings={settings} />
      <HomeLowerSections settings={settings} />
      <FashionFooter />
    </main>
  );
}
