"use client";

type Props = {
  label?: string;
};

export function VerifiedBadge({ label = "Verified" }: Props) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,#2f6b4f_18%,white)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#2f6b4f]"
      title={label}
    >
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="h-3 w-3"
        fill="currentColor"
      >
        <path d="M8 0 9.8 1.2 12 1l.8 2.1L15 4.8l-.7 2.2.7 2.2-2.2.7L12 12.1 9.8 11.9 8 13.1 6.2 11.9 4 12.1l-.8-2.1L1 9.2l.7-2.2L1 4.8l2.2-.7L4 1.9l2.2.2L8 0Zm-.2 9.7 3.6-3.6-.9-.9-2.7 2.7-1.3-1.3-.9.9 2.2 2.2Z" />
      </svg>
      {label}
    </span>
  );
}
