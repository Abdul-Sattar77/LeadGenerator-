"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

// The marketing navbar should only appear on public/marketing pages.
// The (auth) and (app) route groups render their own chrome.
const HIDE_PREFIXES = ["/login", "/register", "/forgot-password", "/verify-email", "/app"];

export default function ConditionalNavbar() {
  const pathname = usePathname();
  const hide = HIDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (hide) return null;
  return <Navbar />;
}
