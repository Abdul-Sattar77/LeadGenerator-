"use client";

import { useEffect, useState } from "react";

// Renders a locale-formatted date/time on the CLIENT only. The server (and the
// first client render) emit an empty span, so SSR and hydration always match —
// avoiding the "text content does not match" hydration error for timestamps.
export function LocalTime({
  iso,
  dateOnly = false,
  className,
}: {
  iso: string;
  dateOnly?: boolean;
  className?: string;
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    const d = new Date(iso);
    setText(
      dateOnly
        ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
        : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    );
  }, [iso, dateOnly]);

  return (
    <span className={className} suppressHydrationWarning>
      {text}
    </span>
  );
}
