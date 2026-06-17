"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Building2,
  Contact2,
  Handshake,
  CheckSquare,
  Megaphone,
  BarChart3,
  UserCog,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { roleAtLeast, type Role } from "@/lib/enums";
import { useUiStore } from "@/stores/uiStore";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  live?: boolean; // implemented now vs. upcoming phase
  minRole?: Role;
};

const NAV: Item[] = [
  { href: "/app", label: "Overview", icon: LayoutDashboard, live: true },
  { href: "/app/discover", label: "Discover", icon: Search, live: true },
  { href: "/app/companies", label: "Companies", icon: Building2, live: true },
  { href: "/app/contacts", label: "Contacts", icon: Contact2, live: true },
  { href: "/app/deals", label: "Deals", icon: Handshake, live: true },
  { href: "/app/tasks", label: "Tasks", icon: CheckSquare, live: true },
  { href: "/app/campaigns", label: "Campaigns", icon: Megaphone, minRole: "MANAGER", live: true },
  { href: "/app/reports", label: "Reports", icon: BarChart3, minRole: "MANAGER", live: true },
  { href: "/app/team", label: "Team", icon: UserCog, minRole: "MANAGER", live: true },
  { href: "/app/settings", label: "Settings", icon: Settings, minRole: "ADMIN", live: true },
];

function NavList({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {NAV.filter((i) => !i.minRole || roleAtLeast(role, i.minRole)).map((item) => {
        const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
        const disabled = !item.live;
        const Icon = item.icon;
        const content = (
          <span
            className={cn(
              "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-gradient-to-r from-indigo-500/12 to-violet-500/12 text-primary shadow-sm ring-1 ring-primary/10"
                : disabled
                  ? "cursor-not-allowed text-muted-foreground/45"
                  : "text-muted-foreground hover:bg-white/70 hover:text-foreground hover:shadow-sm"
            )}
          >
            {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-500 to-violet-500" />}
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
          <Link key={item.href} href={item.href} onClick={onNavigate}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}

function OrgFooter({ orgName, plan }: { orgName: string; plan: string }) {
  return (
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
  );
}

export default function Sidebar({ orgName, plan, role }: { orgName: string; plan: string; role: string }) {
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const close = () => setSidebarOpen(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/60 bg-white/65 backdrop-blur-xl md:flex">
        <div className="flex h-16 items-center border-b border-white/60 px-5">
          <Link href="/app">
            <Logo size={30} />
          </Link>
        </div>
        <NavList role={role} />
        <OrgFooter orgName={orgName} plan={plan} />
      </aside>

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-50 md:hidden", sidebarOpen ? "" : "pointer-events-none")}>
        {/* overlay */}
        <div
          className={cn("absolute inset-0 bg-black/40 transition-opacity duration-200", sidebarOpen ? "opacity-100" : "opacity-0")}
          onClick={close}
        />
        {/* panel */}
        <div
          className={cn(
            "absolute left-0 top-0 flex h-full w-72 max-w-[82%] flex-col bg-white shadow-2xl transition-transform duration-200 ease-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-border px-5">
            <Link href="/app" onClick={close}>
              <Logo size={30} />
            </Link>
            <button onClick={close} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>
          <NavList role={role} onNavigate={close} />
          <OrgFooter orgName={orgName} plan={plan} />
        </div>
      </div>
    </>
  );
}
