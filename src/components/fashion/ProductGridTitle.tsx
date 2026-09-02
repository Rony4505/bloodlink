"use client";

import { useFashionCopy } from "@/lib/fashion/use-fashion-copy";

export function ProductGridTitle({
  kind,
  onDark = false,
}: {
  kind: "empty" | "related";
  onDark?: boolean;
}) {
  const { fc } = useFashionCopy();
  if (kind === "empty") return <>{fc.home.emptyCategory}</>;
  return (
    <h2
      className={`font-[family-name:var(--font-display)] text-4xl font-bold ${
        onDark ? "text-white" : "text-[#4a3348]"
      }`}
    >
      {fc.home.related}
    </h2>
  );
}
