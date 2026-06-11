"use client";

import { Menu } from "lucide-react";
import { useUiStore } from "@/stores/uiStore";

export default function MobileMenuButton() {
  const toggle = useUiStore((s) => s.toggleSidebar);
  return (
    <button
      onClick={toggle}
      className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
