import { isFashionMode } from "@/lib/app-mode";

export default function AccountLoading() {
  if (!isFashionMode()) {
    return <div className="min-h-[40vh] bg-[#1c0a0c]" aria-hidden />;
  }
  return (
    <div className="min-h-[50svh] bg-[#faf8f6] px-5 py-12 md:px-8">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="h-10 w-56 animate-pulse rounded bg-[#ead9e4]" />
        <div className="h-52 animate-pulse rounded-[1.5rem] border border-[#e8d4e8]/40 bg-white" />
      </div>
    </div>
  );
}
