import Link from "next/link";
import { requireAuth } from "@/server/tenant";
import { prisma } from "@/server/db";
import Sidebar from "./_components/Sidebar";
import UserMenu from "./_components/UserMenu";
import MobileMenuButton from "./_components/MobileMenuButton";
import NotificationBell from "./_components/NotificationBell";
import { Logo } from "@/components/Logo";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireAuth();
  const org = await prisma.organization.findUnique({
    where: { id: ctx.organizationId },
    include: { subscription: true },
  });

  return (
    <div className="app-canvas flex min-h-screen">
      <Sidebar
        orgName={org?.name ?? "Workspace"}
        plan={org?.subscription?.plan ?? "FREE"}
        role={ctx.role}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-white/60 bg-white/70 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <MobileMenuButton />
            <Link href="/app"><Logo size={26} /></Link>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <NotificationBell />
            <UserMenu name={ctx.name} role={ctx.role} />
          </div>
        </header>
        <main className="min-w-0 flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
