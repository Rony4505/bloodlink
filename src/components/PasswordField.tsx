"use client";

import { useState } from "react";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
  id?: string;
};

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 3l18 18M10.5 10.7a2.5 2.5 0 003.6 3.4M9.4 5.5A10.5 10.5 0 0121 12c-.7 1.2-1.6 2.3-2.7 3.2M6.2 6.3C4.6 7.6 3.4 9.2 2.5 12c1.8 4.5 6 7.5 9.5 7.5 1.4 0 2.8-.4 4-.1"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12C4.3 7.5 8.5 4.5 12 4.5S19.7 7.5 21.5 12C19.7 16.5 15.5 19.5 12 19.5S4.3 16.5 2.5 12z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function PasswordField({
  label,
  value,
  onChange,
  required,
  autoComplete = "current-password",
  placeholder,
  hint,
  id,
}: Props) {
  const [visible, setVisible] = useState(false);
  const inputId = id || "password-field";

  return (
    <label className="block text-sm" htmlFor={inputId}>
      <span className="mb-1 block font-medium">{label}</span>
      <div className="relative">
        <input
          id={inputId}
          className="field pr-12"
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center px-3 text-[color-mix(in_oklab,var(--ink)_55%,white)] hover:text-[var(--blood-deep)]"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
      {hint ? (
        <span className="mt-1 block text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
