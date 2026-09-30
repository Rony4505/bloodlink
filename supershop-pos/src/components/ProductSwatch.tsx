type Props = {
  name: string;
  hue: number;
  className?: string;
};

export function ProductSwatch({ name, hue, className = "" }: Props) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 42% 42%), hsl(${(hue + 40) % 360} 35% 28%))`,
      }}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(255,255,255,.45), transparent 40%), repeating-linear-gradient(-25deg, transparent, transparent 8px, rgba(255,255,255,.08) 8px, rgba(255,255,255,.08) 9px)",
        }}
      />
      <span className="absolute bottom-2 left-2 text-xs font-semibold tracking-wide text-white/90">
        {initials}
      </span>
    </div>
  );
}
