import { isFashionMode } from "@/lib/app-mode";

export default function CartLoading() {
  if (!isFashionMode()) {
    return <div className="min-h-[40vh] bg-[#1c0a0c]" aria-hidden />;
  }
  return (
    <div className="min-h-[50svh] bg-[#faf8f6] px-5 py-12 md:px-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-10 w-48 animate-pulse rounded bg-[#ead9e4]" />
        <div className="h-40 animate-pulse rounded-[1.5rem] bg-white border border-[#e8d4e8]/40" />
        <div className="h-28 animate-pulse rounded-[1.5rem] bg-white border border-[#e8d4e8]/40" />
      </div>
    </div>
  );
}
