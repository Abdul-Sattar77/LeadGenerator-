"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/Logo";

const links = [
  { href: "/", label: "Home" },
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Over the dark hero on the homepage → translucent dark + light text.
  const overHero = pathname === "/" && !scrolled;

  return (
    <header className={cn("sticky top-0 z-50 transition-all duration-300",
      overHero ? "border-b border-transparent bg-transparent" : "border-b border-border/70 bg-background/80 backdrop-blur-lg")}>
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.03]">
          <LogoMark size={34} className="drop-shadow-sm" />
          <span className={cn("text-lg font-bold tracking-tight", overHero ? "text-white" : "text-foreground")}>Lead<span className="text-gradient">Finder</span></span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className={cn("rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                overHero ? "text-white/75 hover:bg-white/10 hover:text-white" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthed ? (
            <Link href="/app"><Button variant="gradient" size="sm"><LayoutDashboard className="h-4 w-4" /> Open CRM</Button></Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block"><Button variant="ghost" size="sm" className={overHero ? "text-white hover:bg-white/10" : ""}>Log in</Button></Link>
              <Link href="/register"><Button variant="gradient" size="sm">Get Started Free</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
