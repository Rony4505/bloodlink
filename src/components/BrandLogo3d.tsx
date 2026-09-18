/**
 * Glossy 3D-styled BloodLink drop mark (SVG). Used by the intro splash and
 * the login screen; `className` controls size via width/height.
 */
export function BrandLogo3d({
  className = "",
  idPrefix = "bl3d",
}: {
  className?: string;
  idPrefix?: string;
}) {
  const body = `${idPrefix}-body`;
  const rim = `${idPrefix}-rim`;
  const shine = `${idPrefix}-shine`;
  const link = `${idPrefix}-link`;
  return (
    <svg
      viewBox="0 0 100 130"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={body} cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#ff6b7d" />
          <stop offset="38%" stopColor="#e6273c" />
          <stop offset="78%" stopColor="#9b1b2e" />
          <stop offset="100%" stopColor="#5a0b16" />
        </radialGradient>
        <linearGradient id={rim} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={shine} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={link} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f3d9dc" />
        </linearGradient>
      </defs>
      <path
        d="M50 4C50 4 12 54 12 84a38 38 0 0 0 76 0C88 54 50 4 50 4Z"
        fill={`url(#${body})`}
      />
      <path
        d="M50 4C50 4 12 54 12 84a38 38 0 0 0 76 0C88 54 50 4 50 4Z"
        fill={`url(#${rim})`}
      />
      <ellipse cx="38" cy="46" rx="9" ry="18" fill={`url(#${shine})`} transform="rotate(18 38 46)" />
      <rect
        x="40.5"
        y="55"
        width="19"
        height="50"
        rx="9.5"
        fill="none"
        stroke={`url(#${link})`}
        strokeWidth="7"
        transform="rotate(38 50 80)"
      />
      <rect
        x="40.5"
        y="55"
        width="19"
        height="50"
        rx="9.5"
        fill="none"
        stroke="#7a0f1c"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        transform="translate(1.2 1.6) rotate(38 50 80)"
      />
    </svg>
  );
}
