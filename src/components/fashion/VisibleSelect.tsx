"use client";

import { useEffect, useRef, useState } from "react";

type Option = { value: string; label: string };

/** Custom select — avoids white-on-white native option menus. */
export function VisibleSelect({
  value,
  onChange,
  options,
  ariaLabel,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  ariaLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-w-[200px] items-center justify-between gap-3 rounded-xl border-2 border-[#8f624e] bg-[#f3ebe4] px-4 py-2.5 text-left text-sm font-bold text-[#1c1412] shadow-sm"
      >
        <span>{selected?.label}</span>
        <span className="text-[#8f624e]">{open ? "▴" : "▾"}</span>
      </button>
      {open ? (
        <ul className="absolute right-0 z-30 mt-1 max-h-60 min-w-full overflow-y-auto rounded-xl border-2 border-[#8f624e] bg-[#f3ebe4] py-1 shadow-xl">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`block w-full px-4 py-2.5 text-left text-sm font-semibold ${
                    active
                      ? "bg-[#8f624e] text-white"
                      : "text-[#1c1412] hover:bg-[#e8d8cc]"
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
