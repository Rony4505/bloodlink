"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const uniqueImages = useMemo(
    () => [...new Set(images.filter(Boolean))],
    [images],
  );
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const advance = useCallback(() => {
    setIndex((current) => {
      if (uniqueImages.length <= 1) return current;
      const next = current + direction;
      if (next >= uniqueImages.length - 1) {
        setDirection(-1);
        return uniqueImages.length - 1;
      }
      if (next <= 0) {
        setDirection(1);
        return 0;
      }
      return next;
    });
  }, [direction, uniqueImages.length]);

  useEffect(() => {
    setIndex(0);
    setDirection(1);
  }, [uniqueImages]);

  useEffect(() => {
    if (uniqueImages.length <= 1) return;
    const id = window.setInterval(advance, 3200);
    return () => window.clearInterval(id);
  }, [advance, uniqueImages.length]);

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
      <div className="relative h-full w-full overflow-hidden">
        <div
          className="flex h-full transition-transform duration-700 ease-in-out will-change-transform"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {uniqueImages.map((src, imageIndex) => (
            <div key={`${src}-${imageIndex}`} className="h-full w-full shrink-0">
              <ProductImage
                src={src}
                alt={`${alt} ${imageIndex + 1}`}
                className="h-full rounded-none"
                priority={imageIndex === 0}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-1.5 border-t border-black/5 bg-white/80 py-2">
        {uniqueImages.map((src, imageIndex) => (
          <button
            key={`dot-${src}-${imageIndex}`}
            type="button"
            aria-label={`Image ${imageIndex + 1}`}
            onClick={() => setIndex(imageIndex)}
            className={`h-1.5 rounded-full transition-all ${
              imageIndex === index ? "w-4 bg-[#9d6b8a]" : "w-1.5 bg-[#c9a890]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
