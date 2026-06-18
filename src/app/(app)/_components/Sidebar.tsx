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
  Mailbox,
  Megaphone,
  BarChart3,
  UserCog,
  Settings,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { roleAtLeast, type Role } from "@/lib/enums";
import { useUiStore } from "@/stores/uiStore";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  live?: boolean;
  minRole?: Role;
};

const NAV: Item[] = [
  { href: "/app", label: "Overview", icon: LayoutDashboard, live: true },
  { href: "/app/discover", label: "Discover", icon: Search, live: true },
  { href: "/app/companies", label: "Companies", icon: Building2, live: true },
  { href: "/app/contacts", label: "Contacts", icon: Contact2, live: true },
  { href: "/app/deals", label: "Deals", icon: Handshake, live: true },
  { href: "/app/tasks", label: "Tasks", icon: CheckSquare, live: true },
  { href: "/app/sequences", label: "Sequences", icon: Mailbox, minRole: "MANAGER", live: true },
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
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} onClick={onNavigate}>
            <span
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-indigo-500/20 text-white ring-1 ring-indigo-400/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-400 to-violet-400" />}
              <Icon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-indigo-300" : "")} />
              <span className="flex-1">{item.label}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function OrgFooter({ orgName, plan, onNavigate }: { orgName: string; plan: string; onNavigate?: () => void }) {
  return (
    <div className="border-t border-white/10 p-4">
      <Link
        href="/app/billing"
        onClick={onNavigate}
        className="group flex items-center gap-2 rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{orgName}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="inline-flex items-center rounded-full bg-indigo-500/20 px-1.5 py-0.5 font-semibold text-indigo-300">{plan}</span>
            plan · manage
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-300" />
      </Link>
    </div>
  );
}

export default function Sidebar({ orgName, plan, role }: { orgName: string; plan: string; role: string }) {
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const close = () => setSidebarOpen(false);

  return (
    <>
      {/* Desktop sidebar — dark */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-slate-900 text-white md:flex">
        <div className="flex h-16 items-center border-b border-white/10 px-5 text-white">
          <Link href="/app"><Logo size={30} /></Link>
        </div>
        <NavList role={role} />
        <OrgFooter orgName={orgName} plan={plan} />
      </aside>

      {/* Mobile drawer — dark */}
      <div className={cn("fixed inset-0 z-50 md:hidden", sidebarOpen ? "" : "pointer-events-none")}>
        <div
          className={cn("absolute inset-0 bg-black/50 transition-opacity duration-200", sidebarOpen ? "opacity-100" : "opacity-0")}
          onClick={close}
        />
        <div
          className={cn(
            "absolute left-0 top-0 flex h-full w-72 max-w-[82%] flex-col bg-slate-900 text-white shadow-2xl transition-transform duration-200 ease-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
            <Link href="/app" onClick={close}><Logo size={30} /></Link>
            <button onClick={close} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>
          <NavList role={role} onNavigate={close} />
          <OrgFooter orgName={orgName} plan={plan} onNavigate={close} />
        </div>
      </div>
    </>
  );
}
