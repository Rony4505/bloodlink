"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FashionButton } from "@/components/fashion/FashionButton";
import { FashionShell } from "@/components/fashion/FashionShell";
import { copy } from "@/lib/fashion/copy";
import { buildWhatsAppOrderUrl } from "@/lib/fashion/whatsapp";
import type { FashionOrder } from "@/lib/fashion/types";

export default function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<FashionOrder | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("noore_last_order");
    if (raw) {
      setOrder(JSON.parse(raw) as FashionOrder);
      return;
    }
    const orderId = searchParams.get("orderId");
    if (orderId) {
      setOrder({ id: orderId } as FashionOrder);
    }
  }, [searchParams]);

  const whatsappUrl = order && order.items ? buildWhatsAppOrderUrl(order) : null;

  return (
    <FashionShell>
      <section className="mx-auto max-w-3xl px-5 py-20 text-center md:px-8">
        <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold md:text-6xl">
          {copy.checkout.successTitle}
        </h1>
        <p className="mt-5 text-lg leading-8 text-[#6f554a]">{copy.checkout.successBody}</p>
        {order?.id ? (
          <p className="mt-4 text-sm font-semibold text-[#8b6456]">Order ID: {order.id}</p>
        ) : null}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {whatsappUrl ? (
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <FashionButton>{copy.actions.sendWhatsApp}</FashionButton>
            </a>
          ) : null}
          <FashionButton href="/collections" variant="secondary">{copy.actions.continueShopping}</FashionButton>
        </div>
      </section>
    </FashionShell>
  );
}
