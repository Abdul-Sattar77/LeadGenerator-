import { requireAuth } from "@/server/tenant";
import { prisma } from "@/server/db";
import Sidebar from "./_components/Sidebar";
import UserMenu from "./_components/UserMenu";

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
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-end border-b border-white/60 bg-white/70 px-6 backdrop-blur-xl">
          <UserMenu name={ctx.name} role={ctx.role} />
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
