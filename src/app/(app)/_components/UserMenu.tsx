"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  SALES_REP: "Sales Rep",
  VIEWER: "Viewer",
};

export default function UserMenu({ name, role }: { name: string; role: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="text-sm font-semibold leading-tight">{name}</div>
        <div className="text-xs text-muted-foreground">{ROLE_LABEL[role] ?? role}</div>
      </div>
      <span className="brand-gradient flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white">
        {initials}
      </span>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="Sign out"
      >
        <LogOut className="h-4.5 w-4.5" />
      </button>
    </div>
  );
}
