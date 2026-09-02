"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useFashionCopy } from "@/lib/fashion/use-fashion-copy";

export function SearchBar({ variant = "light" }: { variant?: "light" | "dark" }) {
  const router = useRouter();
  const { fc } = useFashionCopy();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <input
        className={
          variant === "dark"
            ? "w-full rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/60 backdrop-blur"
            : "field rounded-full py-2 text-sm"
        }
        placeholder={fc.search.placeholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
    </form>
  );
}
