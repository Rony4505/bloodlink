"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/fashion/cn";
import { fashionStockImage, WORKING_FASHION_STOCK_IMAGES } from "@/lib/fashion/product-image-fixes";

const FALLBACK_SRC = fashionStockImage(WORKING_FASHION_STOCK_IMAGES[0]);

function resolveSrc(src: string | undefined) {
  return src?.trim() || FALLBACK_SRC;
}

export function ProductImage({
  src,
  alt,
  className,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [resolved, setResolved] = useState(() => resolveSrc(src));
  const isLocal = resolved.startsWith("/");

  useEffect(() => {
    setResolved(resolveSrc(src));
  }, [src]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] bg-[#f6ece6]",
        className,
      )}
    >
      {isLocal ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolved}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => {
            if (resolved !== FALLBACK_SRC) setResolved(FALLBACK_SRC);
          }}
        />
      ) : (
        <Image
          src={resolved}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 50vw, 33vw"
          className="object-cover"
          onError={() => {
            if (resolved !== FALLBACK_SRC) setResolved(FALLBACK_SRC);
          }}
        />
      )}
    </div>
  );
}
