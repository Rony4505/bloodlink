import { isFashionMode } from "@/lib/app-mode";

export default function Loading() {
  if (isFashionMode()) {
    return (
      <div className="flex min-h-[100svh] flex-col bg-[#faf8f6]">
        <div className="h-16 border-b border-[#e8d4e8]/50 bg-white/70" />
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-10 md:px-8">
          <div className="h-8 w-40 animate-pulse rounded-full bg-[#ead9e4]" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-[1.5rem] border border-[#e8d4e8]/40 bg-white"
              >
                <div className="aspect-[3/4] animate-pulse bg-[#f3e8ef]" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-[#ead9e4]" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-[#f0e4ec]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100svh] flex-col bg-[#1c0a0c]">
      <div className="h-16 border-b border-white/10" />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-16">
        <div className="h-16 w-16 animate-pulse rounded-full bg-white/20" />
        <div className="mt-6 h-10 w-48 animate-pulse rounded bg-white/25" />
        <div className="mt-4 h-6 w-full max-w-md animate-pulse rounded bg-white/15" />
        <div className="mt-8 flex gap-3">
          <div className="h-12 w-36 animate-pulse rounded-full bg-[var(--blood)]/70" />
          <div className="h-12 w-36 animate-pulse rounded-full bg-white/15" />
        </div>
      </div>
    </div>
  );
}
