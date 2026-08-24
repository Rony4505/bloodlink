"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  className?: string;
  suffix?: string;
};

export function CountUp({ value, className, suffix = "" }: Props) {
  const [shown, setShown] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = Math.max(0, Math.floor(value) || 0);
    let started = false;

    function animate() {
      const start = performance.now();
      const duration = Math.min(1800, 550 + Math.sqrt(target) * 28);
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - t) ** 3;
        setShown(Math.round(eased * target));
        if (t < 1) frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || started) return;
        started = true;
        animate();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {shown.toLocaleString()}
      {suffix}
    </span>
  );
}
