import { isFashionMode } from "@/lib/app-mode";

/** Lightweight product-route loading — Smart Craft cream, never BloodLink red. */
export default function ProductLoading() {
  if (!isFashionMode()) {
    return (
      <div className="min-h-[40vh] bg-[#1c0a0c]" aria-hidden />
    );
  }

  return (
    <div className="min-h-[70svh] bg-[#faf8f6] px-5 py-10 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2">
        <div className="aspect-[3/4] animate-pulse rounded-[1.5rem] bg-[#f3e8ef]" />
        <div className="space-y-4 pt-2">
          <div className="h-4 w-24 animate-pulse rounded bg-[#ead9e4]" />
          <div className="h-9 w-3/4 animate-pulse rounded bg-[#e8d4e0]" />
          <div className="h-7 w-28 animate-pulse rounded bg-[#ead9e4]" />
          <div className="mt-6 h-40 animate-pulse rounded-2xl bg-[#f5eef3]" />
          <div className="flex gap-3 pt-2">
            <div className="h-12 flex-1 animate-pulse rounded-xl bg-[#e8d4e0]" />
            <div className="h-12 flex-1 animate-pulse rounded-xl bg-[#ead9e4]" />
          </div>
        </div>
      </div>
    </div>
  );
}
