"use client";

type Props = {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  onClose: () => void;
};

export function AdminPopup({
  open,
  title,
  body,
  confirmLabel = "OK",
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 backdrop-blur-[2px] sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-[1.75rem] border border-[var(--line)] bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--sage)_16%,white)] text-2xl text-[var(--sage)]">
          ✓
        </div>
        <h3 className="mt-4 text-center font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--blood-deep)]">
          {title}
        </h3>
        {body ? (
          <p className="mt-2 text-center text-sm leading-relaxed text-[color-mix(in_oklab,var(--ink)_70%,white)]">
            {body}
          </p>
        ) : null}
        <button type="button" className="btn-primary mt-6 w-full" onClick={onClose}>
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

type PanelProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
};

export function AdminSettingsPanel({
  open,
  title,
  subtitle,
  onClose,
  children,
  wide,
}: PanelProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-[var(--line)] bg-[color-mix(in_oklab,var(--mist)_40%,white)] shadow-2xl sm:rounded-[1.75rem] ${
          wide ? "max-w-3xl" : "max-w-xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] bg-white/90 px-5 py-4">
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_65%,white)]">
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[color-mix(in_oklab,var(--sand)_35%,white)] px-3 py-1 text-sm font-semibold"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
