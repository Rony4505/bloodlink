"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FASHION_CAROUSEL_INTERVAL_MS,
  FASHION_CAROUSEL_TRANSITION_CLASS,
} from "@/lib/fashion/carousel-config";
import { getProductImages } from "@/lib/fashion/product-images";
import type { Product } from "@/lib/fashion/types";
import { ProductImage } from "./ProductImage";

function SlideDots({
  count,
  index,
  onSelect,
  variant = "overlay",
}: {
  count: number;
  index: number;
  onSelect: (i: number) => void;
  variant?: "overlay" | "bar";
}) {
  if (count <= 1) return null;

  if (variant === "bar") {
    return (
      <div className="flex justify-center gap-1.5 border-t border-black/5 bg-white/80 py-2">
        {Array.from({ length: count }, (_, imageIndex) => (
          <button
            key={imageIndex}
            type="button"
            aria-label={`Image ${imageIndex + 1}`}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(imageIndex);
            }}
            className={`h-2 rounded-full transition-all ${
              imageIndex === index ? "w-5 bg-[#9d6b8a]" : "w-2 bg-[#c9a890]"
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
      {Array.from({ length: count }, (_, imageIndex) => (
        <button
          key={imageIndex}
          type="button"
          aria-label={`Image ${imageIndex + 1}`}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(imageIndex);
          }}
          className={`h-1.5 rounded-full transition-all ${
            imageIndex === index ? "w-5 bg-white shadow-sm" : "w-1.5 bg-white/50"
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
  onPauseChange,
}: {
  images: string[];
  alt: string;
  index: number;
  onIndexChange: (next: number) => void;
  className?: string;
  showArrows?: boolean;
  onImageClick?: () => void;
  onSwipe?: (delta: number) => void;
  onPauseChange?: (paused: boolean) => void;
}) {
  const touchStartX = useRef(0);

  function go(delta: number) {
    onIndexChange((index + delta + images.length) % images.length);
  }

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${onImageClick ? "cursor-zoom-in" : ""} ${className ?? ""}`}
      onMouseEnter={() => onPauseChange?.(true)}
      onMouseLeave={() => onPauseChange?.(false)}
      onFocus={() => onPauseChange?.(true)}
      onBlur={() => onPauseChange?.(false)}
      onTouchStart={(event) => {
        onPauseChange?.(true);
        touchStartX.current = event.touches[0]?.clientX ?? 0;
      }}
      onTouchEnd={(event) => {
        onPauseChange?.(false);
        if (!onSwipe) return;
        const diff = touchStartX.current - (event.changedTouches[0]?.clientX ?? touchStartX.current);
        if (Math.abs(diff) > 40) go(diff > 0 ? 1 : -1);
      }}
      onClick={onImageClick}
    >
      <div
        className={`flex h-full ${FASHION_CAROUSEL_TRANSITION_CLASS}`}
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((src, imageIndex) => (
          <div key={`${src}-${imageIndex}`} className="relative h-full w-full shrink-0">
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
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/85 px-3 py-2 text-sm font-bold shadow-md"
            onClick={(event) => {
              event.stopPropagation();
              go(-1);
            }}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next image"
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/85 px-3 py-2 text-sm font-bold shadow-md"
            onClick={(event) => {
              event.stopPropagation();
              go(1);
            }}
          >
            ›
          </button>
        </>
      ) : null}

      {images.length > 1 ? (
        <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {index + 1}/{images.length}
        </span>
      ) : null}
    </div>
  );
}

function useAutoGallery(images: string[], intervalMs: number, enabled: boolean) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [images]);

  const step = useCallback(
    (delta: number) => {
      setIndex((current) => {
        if (!images.length) return 0;
        return (current + delta + images.length) % images.length;
      });
    },
    [images.length],
  );

  useEffect(() => {
    if (!enabled || images.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, images.length, intervalMs]);

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
  const [paused, setPaused] = useState(false);
  const { index, setIndex, step } = useAutoGallery(
    images,
    FASHION_CAROUSEL_INTERVAL_MS,
    !lightbox && !paused,
  );

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
          onPauseChange={setPaused}
        />
        <SlideDots count={images.length} index={index} onSelect={setIndex} variant="bar" />
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
  const [paused, setPaused] = useState(false);
  const { index, setIndex, step } = useAutoGallery(
    images,
    FASHION_CAROUSEL_INTERVAL_MS,
    !paused,
  );

  if (images.length <= 1) {
    return <ProductImage src={images[0] ?? ""} alt={alt} className={className} />;
  }

  return (
    <div className={`relative overflow-hidden rounded-none ${className}`}>
      <ImageSlides
        images={images}
        alt={alt}
        index={index}
        onIndexChange={setIndex}
        className="h-full"
        onSwipe={step}
        onPauseChange={setPaused}
      />
      <SlideDots count={images.length} index={index} onSelect={setIndex} variant="overlay" />
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
      if (event.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (event.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
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
          onSwipe={(delta) => setIndex((i) => (i + delta + images.length) % images.length)}
        />
        <SlideDots count={images.length} index={index} onSelect={setIndex} variant="overlay" />
      </div>
    </div>
  );
}
