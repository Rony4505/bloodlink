export default function Loading() {
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
