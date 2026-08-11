import { Suspense } from "react";
import SearchPageClient from "./SearchPageClient";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fffaf7]" />}>
      <SearchPageClient />
    </Suspense>
  );
}
