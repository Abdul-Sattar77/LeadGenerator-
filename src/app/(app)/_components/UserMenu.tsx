"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  SALES_REP: "Sales Rep",
  VIEWER: "Viewer",
};

export default function UserMenu({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <div className="text-sm font-semibold leading-tight">{name}</div>
        <div className="text-xs text-muted-foreground">{ROLE_LABEL[role] ?? role}</div>
      </div>
      <Avatar name={name} size="md" />
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
