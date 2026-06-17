import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { isOrgMember } from "@/server/orgGuards";
import { getTimeline } from "@/server/services/recordService";
import type { CreateCompanyInput, UpdateCompanyInput } from "@/lib/validations/company";

export interface CompanyFilters {
  q?: string;
  ownerId?: string;
}

export async function listCompanies(
  ctx: TenantContext,
  filters: CompanyFilters,
  page = 1,
  pageSize = 20
) {
  const where = {
    organizationId: ctx.organizationId,
    ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q } },
            { domain: { contains: filters.q } },
            { industry: { contains: filters.q } },
            { city: { contains: filters.q } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.company.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { contacts: true, deals: true } },
      },
    }),
    prisma.company.count({ where }),
  ]);

  // Open deal value per company (one grouped query).
  const ids = rows.map((r) => r.id);
  const openValues = ids.length
    ? await prisma.deal.groupBy({
        by: ["companyId"],
        where: { companyId: { in: ids }, status: "OPEN" },
        _sum: { value: true },
      })
    : [];
  const valueOf = new Map(openValues.map((v) => [v.companyId, Number(v._sum.value ?? 0)]));

  return {
    companies: rows.map((c) => ({
      id: c.id,
      name: c.name,
      domain: c.domain,
      website: c.website,
      industry: c.industry,
      city: c.city,
      country: c.country,
      phone: c.phone,
      owner: c.owner,
      contactCount: c._count.contacts,
      dealCount: c._count.deals,
      openValue: valueOf.get(c.id) ?? 0,
      createdAt: c.createdAt,
    })),
    total,
  };
}

export async function getCompany(ctx: TenantContext, id: string) {
  const company = await prisma.company.findFirst({
    where: { id, organizationId: ctx.organizationId },
    include: {
      owner: { select: { id: true, name: true } },
      contacts: {
        orderBy: { createdAt: "desc" },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, title: true },
      },
      deals: {
        orderBy: { createdAt: "desc" },
        include: { stage: { select: { name: true, kind: true } } },
      },
    },
  });
  if (!company) return null;

  const timeline = await getTimeline(ctx, { companyId: id });
  return { ...company, timeline };
}

export async function createCompany(ctx: TenantContext, input: CreateCompanyInput) {
  if (!(await isOrgMember(ctx, input.ownerId))) {
    throw new Error("Owner must be a member of your organization.");
  }
  return prisma.company.create({
    data: { organizationId: ctx.organizationId, source: "MANUAL", ...input },
  });
}

export async function updateCompany(ctx: TenantContext, id: string, input: UpdateCompanyInput) {
  const existing = await prisma.company.findFirst({
    where: { id, organizationId: ctx.organizationId },
    select: { id: true },
  });
  if (!existing) throw new Error("Company not found.");
  if (!(await isOrgMember(ctx, input.ownerId))) {
    throw new Error("Owner must be a member of your organization.");
  }
  return prisma.company.update({ where: { id }, data: input });
}

export async function deleteCompany(ctx: TenantContext, id: string) {
  const existing = await prisma.company.findFirst({
    where: { id, organizationId: ctx.organizationId },
    select: { id: true },
  });
  if (!existing) throw new Error("Company not found.");
  await prisma.company.delete({ where: { id } });
}
