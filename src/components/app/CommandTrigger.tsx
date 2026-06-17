"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

// Header button that opens the ⌘K command palette. Shows the platform-correct shortcut.
export function CommandTrigger() {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
      className="flex h-9 items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary"
      aria-label="Search (Command+K)"
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search…</span>
      <kbd className="ml-1 hidden rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] sm:inline">
        {isMac ? "⌘" : "Ctrl"} K
      </kbd>
    </button>
  );
}
