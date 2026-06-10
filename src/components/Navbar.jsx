"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/Logo";

const links = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Find Leads" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/priorities", label: "Priorities" },
  { href: "/pricing", label: "Pricing" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { status } = useSession();
  const isAuthed = status === "authenticated";

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.03]"
        >
          <LogoMark size={34} className="drop-shadow-sm" />
          <span className="text-lg font-bold tracking-tight">
            Lead<span className="text-gradient">Finder</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthed ? (
            <Link href="/app">
              <Button variant="gradient" size="sm">
                <LayoutDashboard className="h-4 w-4" />
                Open CRM
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="gradient" size="sm">
                  Start free
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
