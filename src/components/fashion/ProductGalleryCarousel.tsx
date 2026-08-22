"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getProductImages } from "@/lib/fashion/product-images";
import type { Product } from "@/lib/fashion/types";
import { ProductImage } from "./ProductImage";

const AUTO_SCROLL_MS = 2500;
const SLIDE_TRANSITION_MS = 700;

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
            event.preventDefault();
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
  compactArrows,
  onImageClick,
  onSwipe,
}: {
  images: string[];
  alt: string;
  index: number;
  onIndexChange: (next: number) => void;
  className?: string;
  showArrows?: boolean;
  compactArrows?: boolean;
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
        className="flex h-full w-full ease-in-out will-change-transform"
        style={{
          transition: `transform ${SLIDE_TRANSITION_MS}ms ease-in-out`,
          transform: `translateX(-${index * 100}%)`,
        }}
      >
        {images.map((src, imageIndex) => (
          <div key={`${src}-${imageIndex}`} className="h-full min-w-full flex-[0_0_100%] shrink-0">
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
            className={
              compactArrows
                ? "absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 px-2 py-1 text-sm shadow-md opacity-100 transition sm:opacity-0 sm:group-hover/card-gallery:opacity-100"
                : "absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-lg shadow-md"
            }
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onIndexChange(Math.max(0, index - 1));
            }}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next image"
            className={
              compactArrows
                ? "absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 px-2 py-1 text-sm shadow-md opacity-100 transition sm:opacity-0 sm:group-hover/card-gallery:opacity-100"
                : "absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-lg shadow-md"
            }
            onClick={(event) => {
              event.preventDefault();
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

function useAutoGallery(images: string[], intervalMs: number, enabled: boolean, pingPong = false) {
  const [index, setIndex] = useState(0);
  const directionRef = useRef(1);

  useEffect(() => {
    setIndex(0);
    directionRef.current = 1;
  }, [images]);

  const step = useCallback(
    (delta: number) => {
      setIndex((current) => {
        if (!images.length) return 0;
        return (current + delta + images.length) % images.length;
      });
      directionRef.current = delta >= 0 ? 1 : -1;
    },
    [images.length],
  );

  const goTo = useCallback((next: number) => {
    setIndex((current) => {
      directionRef.current = next >= current ? 1 : -1;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!enabled || images.length <= 1) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const id = window.setInterval(() => {
      setIndex((current) => {
        const last = images.length - 1;
        if (!pingPong || last === 0) {
          return (current + 1) % images.length;
        }

        let next = current + directionRef.current;
        if (next >= last) {
          directionRef.current = -1;
          next = last;
        } else if (next <= 0) {
          directionRef.current = 1;
          next = 0;
        }
        return next;
      });
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [enabled, images.length, intervalMs, pingPong]);

  return { index, setIndex: goTo, step };
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
  const { index, setIndex, step } = useAutoGallery(images, AUTO_SCROLL_MS, !lightbox, true);

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
  const [locked, setLocked] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { index: previewIndex, setIndex: setPreviewIndex, step } = useAutoGallery(
    images,
    AUTO_SCROLL_MS,
    !locked,
    true,
  );

  const selectImage = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(images.length - 1, next));
      setSelectedIndex(clamped);
      setPreviewIndex(clamped);
      setLocked(true);
    },
    [images.length, setPreviewIndex],
  );

  useEffect(() => {
    setLocked(false);
    setSelectedIndex(0);
  }, [images.join("|")]);

  if (images.length <= 1) {
    return <ProductImage src={images[0] ?? ""} alt={alt} className={className} />;
  }

  if (!locked) {
    return (
      <div
        className={`group/card-gallery relative overflow-hidden rounded-none ${className}`}
        onClick={(event) => event.stopPropagation()}
      >
        <ImageSlides
          images={images}
          alt={alt}
          index={previewIndex}
          onIndexChange={selectImage}
          className="h-full"
          showArrows
          compactArrows
          onSwipe={(delta) => {
            const next = (previewIndex + delta + images.length) % images.length;
            selectImage(next);
          }}
          onImageClick={() => selectImage(previewIndex)}
        />
        <SlideDots count={images.length} index={previewIndex} onSelect={selectImage} compact />
      </div>
    );
  }

  const mainSrc = images[selectedIndex] ?? images[0];
  const thumbImages = images
    .map((src, imageIndex) => ({ src, imageIndex }))
    .filter(({ imageIndex }) => imageIndex !== selectedIndex);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-none bg-[#f6ece6] ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="relative min-h-0 flex-1">
        <ProductImage src={mainSrc} alt={`${alt} ${selectedIndex + 1}`} className="h-full rounded-none" />
      </div>
      {thumbImages.length > 0 ? (
        <div className="flex shrink-0 gap-1.5 overflow-x-auto border-t border-black/5 bg-white/95 p-1.5 sm:p-2">
          {thumbImages.map(({ src, imageIndex }) => (
            <button
              key={`${src}-${imageIndex}`}
              type="button"
              aria-label={`View image ${imageIndex + 1}`}
              className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border-2 border-[#e8c4b0]/60 transition hover:border-[#9d6b8a] sm:h-12 sm:w-12"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setSelectedIndex(imageIndex);
                setPreviewIndex(imageIndex);
              }}
            >
              <ProductImage src={src} alt={`${alt} ${imageIndex + 1}`} className="h-full w-full rounded-md" />
            </button>
          ))}
        </div>
      ) : null}
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
