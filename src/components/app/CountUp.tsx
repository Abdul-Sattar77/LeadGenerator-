"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";

// Animated number that counts up from 0 when it scrolls into view.
export function CountUp({
  value,
  format = (n: number) => Math.round(n).toLocaleString(),
  duration = 1.1,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(format(v)),
    });
    return () => controls.stop();
  }, [inView, value, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  return <span ref={ref} className={className}>{display}</span>;
}
