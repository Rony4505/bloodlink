import { isFashionMode } from "@/lib/app-mode";

export default function CollectionsLoading() {
  if (!isFashionMode()) {
    return <div className="min-h-[40vh] bg-[#1c0a0c]" aria-hidden />;
  }

  return (
    <div className="min-h-[60svh] bg-[#faf8f6] px-5 py-10 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="h-8 w-48 animate-pulse rounded-full bg-[#ead9e4]" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-[1.5rem] border border-[#e8d4e8]/40 bg-white"
            >
              <div className="aspect-[3/4] animate-pulse bg-[#f3e8ef]" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-[#ead9e4]" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-[#f0e4ec]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
