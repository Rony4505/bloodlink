"use client";

import { useCallback, useEffect, useState } from "react";
import { getProductImages } from "@/lib/fashion/product-images";
import type { Product } from "@/lib/fashion/types";
import { ProductImage } from "./ProductImage";

function SlideDots({
  count,
  index,
  onSelect,
  compact,
}: {
  count: number;
  index: number;
  onSelect: (i: number) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5"
          : "flex justify-center gap-1.5 border-t border-black/5 bg-white/80 py-2"
      }
    >
      {Array.from({ length: count }, (_, imageIndex) => (
        <button
          key={imageIndex}
          type="button"
          aria-label={`Image ${imageIndex + 1}`}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(imageIndex);
          }}
          className={`rounded-full transition-all ${
            imageIndex === index
              ? compact
                ? "h-1.5 w-3 bg-[#9d6b8a]"
                : "h-2 w-5 bg-[#9d6b8a]"
              : compact
                ? "h-1.5 w-1.5 bg-white/80"
                : "h-2 w-2 bg-[#c9a890]"
          }`}
        />
      ))}
    </div>
  );
}

function ImageSlides({
  images,
  alt,
  index,
  onIndexChange,
  className,
  showArrows,
  onImageClick,
  onSwipe,
}: {
  images: string[];
  alt: string;
  index: number;
  onIndexChange: (next: number) => void;
  className?: string;
  showArrows?: boolean;
  onImageClick?: () => void;
  onSwipe?: (delta: number) => void;
}) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${onImageClick ? "cursor-zoom-in" : ""} ${className ?? ""}`}
      onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
      onTouchEnd={(event) => {
        if (touchStartX === null || !onSwipe) return;
        const delta = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
        if (Math.abs(delta) > 40) onSwipe(delta < 0 ? 1 : -1);
        setTouchStartX(null);
      }}
      onClick={onImageClick}
    >
      <div
        className="flex h-full transition-transform duration-700 ease-in-out will-change-transform"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((src, imageIndex) => (
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

      {showArrows && images.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous image"
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-lg shadow-md"
            onClick={(event) => {
              event.stopPropagation();
              onIndexChange(Math.max(0, index - 1));
            }}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next image"
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-lg shadow-md"
            onClick={(event) => {
              event.stopPropagation();
              onIndexChange(Math.min(images.length - 1, index + 1));
            }}
          >
            ›
          </button>
        </>
      ) : null}
    </div>
  );
}

function useAutoGallery(images: string[], intervalMs: number, enabled: boolean) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    setIndex(0);
    setDirection(1);
  }, [images]);

  const step = useCallback(
    (delta: number) => {
      setIndex((current) => {
        const next = current + delta;
        if (next >= images.length - 1) {
          setDirection(-1);
          return images.length - 1;
        }
        if (next <= 0) {
          setDirection(1);
          return 0;
        }
        setDirection(delta > 0 ? 1 : -1);
        return next;
      });
    },
    [images.length],
  );

  useEffect(() => {
    if (!enabled || images.length <= 1) return;
    const id = window.setInterval(() => step(direction), intervalMs);
    return () => window.clearInterval(id);
  }, [direction, enabled, images.length, intervalMs, step]);

  return { index, setIndex, step };
}

export function ProductGalleryCarousel({
  images,
  alt,
  className = "h-[34rem]",
}: {
  images: string[];
  alt: string;
  className?: string;
}) {
  const [lightbox, setLightbox] = useState(false);
  const { index, setIndex, step } = useAutoGallery(images, 3200, !lightbox);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(false);
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, step]);

  if (!images.length) {
    return <ProductImage src="" alt={alt} className={className} priority />;
  }

  if (images.length === 1) {
    return (
      <>
        <button type="button" className="block w-full" onClick={() => setLightbox(true)}>
          <ProductImage src={images[0]} alt={alt} className={className} priority />
        </button>
        {lightbox ? (
          <LightboxViewer images={images} alt={alt} startIndex={0} onClose={() => setLightbox(false)} />
        ) : null}
      </>
    );
  }

  return (
    <>
      <div className={`overflow-hidden rounded-[2rem] border border-black/6 bg-[#faf4f0] ${className}`}>
        <ImageSlides
          images={images}
          alt={alt}
          index={index}
          onIndexChange={setIndex}
          className="h-full"
          showArrows
          onImageClick={() => setLightbox(true)}
          onSwipe={step}
        />
        <SlideDots count={images.length} index={index} onSelect={setIndex} />
      </div>
      {lightbox ? (
        <LightboxViewer images={images} alt={alt} startIndex={index} onClose={() => setLightbox(false)} />
      ) : null}
    </>
  );
}

export function ProductCardGallery({
  product,
  alt,
  className = "h-40 sm:h-56 md:h-72",
}: {
  product: Pick<Product, "imageUrl" | "imageUrls">;
  alt: string;
  className?: string;
}) {
  const images = getProductImages(product);
  const { index, setIndex, step } = useAutoGallery(images, 2800, true);

  if (images.length <= 1) {
    return <ProductImage src={images[0] ?? ""} alt={alt} className={className} />;
  }

  return (
    <div className={`overflow-hidden rounded-none ${className}`}>
      <ImageSlides
        images={images}
        alt={alt}
        index={index}
        onIndexChange={setIndex}
        className="h-full"
        onSwipe={step}
      />
      <SlideDots count={images.length} index={index} onSelect={setIndex} compact />
    </div>
  );
}

function LightboxViewer({
  images,
  alt,
  startIndex,
  onClose,
}: {
  images: string[];
  alt: string;
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setIndex((i) => Math.min(images.length - 1, i + 1));
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center bg-black/88 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-4 top-4 z-[610] rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white"
        onClick={onClose}
      >
        বন্ধ
      </button>
      <div
        className="relative h-[min(85vh,760px)] w-full max-w-4xl overflow-hidden rounded-[1.5rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <ImageSlides
          images={images}
          alt={alt}
          index={index}
          onIndexChange={setIndex}
          className="h-full"
          showArrows
          onSwipe={(delta) =>
            setIndex((i) => Math.max(0, Math.min(images.length - 1, i + delta)))
          }
        />
        <SlideDots count={images.length} index={index} onSelect={setIndex} compact />
      </div>
    </div>
  );
}
