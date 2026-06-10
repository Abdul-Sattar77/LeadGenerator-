"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Users,
  KanbanSquare,
  CheckSquare,
  Megaphone,
  BarChart3,
  UserCog,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { roleAtLeast, type Role } from "@/lib/enums";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  live?: boolean; // implemented now vs. upcoming phase
  minRole?: Role;
};

const NAV: Item[] = [
  { href: "/app", label: "Overview", icon: LayoutDashboard, live: true },
  { href: "/search", label: "Discover Leads", icon: Search, live: true },
  { href: "/app/leads", label: "Leads", icon: Users, live: true },
  { href: "/app/pipeline", label: "Pipeline", icon: KanbanSquare, live: true },
  { href: "/app/tasks", label: "Tasks", icon: CheckSquare, live: true },
  { href: "/app/campaigns", label: "Campaigns", icon: Megaphone, minRole: "MANAGER" },
  { href: "/app/reports", label: "Reports", icon: BarChart3, minRole: "MANAGER" },
  { href: "/app/team", label: "Team", icon: UserCog, minRole: "MANAGER" },
  { href: "/app/settings", label: "Settings", icon: Settings, minRole: "ADMIN" },
];

export default function Sidebar({
  orgName,
  plan,
  role,
}: {
  orgName: string;
  plan: string;
  role: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/app">
          <Logo size={30} />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.filter((i) => !i.minRole || roleAtLeast(role, i.minRole)).map((item) => {
          const active = pathname === item.href;
          const disabled = !item.live;
          const Icon = item.icon;
          const content = (
            <span
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : disabled
                    ? "cursor-not-allowed text-muted-foreground/50"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {disabled && (
                <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Soon
                </span>
              )}
            </span>
          );
          return disabled ? (
            <div key={item.href} title="Coming in a later phase">{content}</div>
          ) : (
            <Link key={item.href} href={item.href}>
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-xl bg-secondary/60 p-3">
          <div className="truncate text-sm font-semibold">{orgName}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center rounded-full bg-accent px-1.5 py-0.5 font-semibold text-accent-foreground">
              {plan}
            </span>
            plan
          </div>
        </div>
      </div>
    </aside>
  );
}
