"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ProductImage } from "./ProductImage";

export function ProductGalleryCarousel({
  images,
  alt,
  className = "h-[34rem]",
}: {
  images: string[];
  alt: string;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const uniqueImages = useMemo(
    () => [...new Set(images.filter(Boolean))],
    [images],
  );

  useEffect(() => {
    if (uniqueImages.length <= 1) return;
    const el = scrollRef.current;
    if (!el) return;

    const step = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      const next = el.scrollLeft + direction * 1.2;
      if (next >= maxScroll) {
        setDirection(-1);
        el.scrollLeft = maxScroll;
      } else if (next <= 0) {
        setDirection(1);
        el.scrollLeft = 0;
      } else {
        el.scrollLeft = next;
      }
    };

    const id = window.setInterval(step, 20);
    return () => window.clearInterval(id);
  }, [direction, uniqueImages.length]);

  if (uniqueImages.length <= 1) {
    return (
      <ProductImage
        src={uniqueImages[0] ?? ""}
        alt={alt}
        className={className}
        priority
      />
    );
  }

  return (
    <div className={`overflow-hidden rounded-[2rem] border border-black/6 bg-[#faf4f0] ${className}`}>
      <div
        ref={scrollRef}
        className="flex h-full snap-x snap-mandatory gap-0 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {uniqueImages.map((src, index) => (
          <div key={`${src}-${index}`} className="h-full min-w-full shrink-0 snap-center">
            <ProductImage src={src} alt={`${alt} ${index + 1}`} className="h-full rounded-none" priority={index === 0} />
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5 border-t border-black/5 bg-white/80 py-2">
        {uniqueImages.map((src, index) => (
          <span
            key={`dot-${src}-${index}`}
            className="h-1.5 w-1.5 rounded-full bg-[#c9a890]"
          />
        ))}
      </div>
    </div>
  );
}
