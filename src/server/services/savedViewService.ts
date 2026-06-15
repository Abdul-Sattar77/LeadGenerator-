import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";

export interface ViewFilters {
  status?: string;
  q?: string;
}

export async function listViews(ctx: TenantContext) {
  const rows = await prisma.savedView.findMany({
    where: { userId: ctx.userId, organizationId: ctx.organizationId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((v) => {
    let filters: ViewFilters = {};
    try { filters = JSON.parse(v.filters); } catch { /* ignore */ }
    return { id: v.id, name: v.name, filters };
  });
}

export async function createView(ctx: TenantContext, name: string, filters: ViewFilters) {
  const v = await prisma.savedView.create({
    data: { userId: ctx.userId, organizationId: ctx.organizationId, name, filters: JSON.stringify(filters) },
  });
  return { id: v.id, name: v.name, filters };
}

export async function deleteView(ctx: TenantContext, id: string): Promise<boolean> {
  const res = await prisma.savedView.deleteMany({ where: { id, userId: ctx.userId } });
  return res.count > 0;
}
