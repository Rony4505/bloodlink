import { FashionFooter } from "@/components/fashion/FashionFooter";
import { FashionHeader } from "@/components/fashion/FashionHeader";
import { HomeProductBrowse } from "@/components/fashion/HomeProductBrowse";
import { HomeHeroActions, HomeLowerSections } from "@/components/fashion/HomeLocalized";
import { PromoCarousel } from "@/components/fashion/PromoCarousel";
import { TopLanguageBar } from "@/components/fashion/LanguageSwitcher";
import { buildCarouselSlides } from "@/lib/fashion/carousel-slides";
import { getCategories } from "@/lib/fashion/categories-server";
import { copy } from "@/lib/fashion/copy";
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

  const carouselSlides = buildCarouselSlides(banners, offers, newProducts);
  const displayCoupons = settings.showCouponsOnHome !== false ? coupons : [];

  return (
    <main className="min-h-screen bg-[#fffaf7] text-[#241815]">
      <TopLanguageBar />
      <section className="relative overflow-hidden border-b border-black/5 bg-[radial-gradient(circle_at_top_left,#fff6ef,transparent_35%),linear-gradient(135deg,#2c1d1a_0%,#4f342f_48%,#b88b74_100%)] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_38%,rgba(255,255,255,0.12)_100%)]" />
        <div className="hero-orb pointer-events-none absolute -left-16 top-24 h-72 w-72 rounded-full bg-[#f4d4c2]/20 blur-3xl" />
        <div className="hero-drift pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#f8e5d6]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-14 md:px-8 md:pb-24 md:pt-16">
          <FashionHeader variant="dark" />

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/15 shadow-lg">
            <PromoCarousel slides={carouselSlides} coupons={displayCoupons} products={products} />
          </div>

          <HomeHeroActions
            heroSubtitle={settings.heroSubtitle ?? copy.tagline}
            heroTitle={settings.heroTitle ?? "সহজ luxury, refined style, modern Bangladesh."}
            heroDescription={
              settings.heroDescription ??
              "Slowgun এমন একটি e-commerce experience যেখানে premium fabric, soft color palette, festive elegance, আর daily sophistication—সবকিছু একসাথে পাওয়া যায়।"
            }
          />
        </div>
      </section>

      <HomeProductBrowse
        categories={categories}
        products={products}
        newProducts={newProducts}
        offerProducts={offers}
      />

      <HomeLowerSections />
      <FashionFooter />
    </main>
  );
}
