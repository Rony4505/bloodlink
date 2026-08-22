/** Fullscreen promo layout — no site header/footer. */
export default function PromoLayout({ children }: LayoutProps<"/promo">) {
  return (
    <div className="promo-layout min-h-dvh overflow-hidden bg-[#050508] text-white">
      {children}
    </div>
  );
}
