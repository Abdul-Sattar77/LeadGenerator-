import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { isOrgMember } from "@/server/orgGuards";
import { getTimeline } from "@/server/services/recordService";
import { getLeadLimit } from "@/server/services/billingService";
import { PlanLimitError } from "@/lib/plans";
import type { CreateCompanyInput, UpdateCompanyInput } from "@/lib/validations/company";

/** Throws PlanLimitError if the org is at its plan's company cap (Free = 100). */
export async function assertCompanyCapacity(ctx: TenantContext) {
  const limit = await getLeadLimit(ctx.organizationId);
  if (limit == null) return; // unlimited (paid)
  const count = await prisma.company.count({ where: { organizationId: ctx.organizationId } });
  if (count >= limit) throw new PlanLimitError(limit);
}

export interface CompanyFilters {
  q?: string;
  ownerId?: string;
  tagId?: string;
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
    ...(filters.tagId ? { tagLinks: { some: { tagId: filters.tagId } } } : {}),
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
        tagLinks: { include: { tag: { select: { id: true, name: true, color: true } } } },
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
      tags: c.tagLinks.map((tl) => tl.tag),
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
      tagLinks: { include: { tag: { select: { id: true, name: true, color: true } } } },
    },
  });
  if (!company) return null;

  const timeline = await getTimeline(ctx, { companyId: id });
  return { ...company, timeline };
}

export async function createCompany(ctx: TenantContext, input: CreateCompanyInput) {
  await assertCompanyCapacity(ctx); // Free plan = 100 companies
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

export async function bulkCompanies(
  ctx: TenantContext,
  ids: string[],
  action: "delete" | "assignOwner" | "addTag",
  value?: string
) {
  const scope = { id: { in: ids }, organizationId: ctx.organizationId };
  if (action === "delete") {
    const res = await prisma.company.deleteMany({ where: scope });
    return { affected: res.count };
  }
  if (action === "assignOwner") {
    if (!(await isOrgMember(ctx, value))) throw new Error("Owner must be in your organization.");
    const res = await prisma.company.updateMany({ where: scope, data: { ownerId: value || null } });
    return { affected: res.count };
  }
  if (action === "addTag") {
    if (!value) throw new Error("Tag required.");
    const tag = await prisma.tag.findFirst({ where: { id: value, organizationId: ctx.organizationId }, select: { id: true } });
    if (!tag) throw new Error("Tag not found.");
    const targets = await prisma.company.findMany({ where: scope, select: { id: true } });
    let added = 0;
    for (const t of targets) {
      const exists = await prisma.tagLink.findFirst({ where: { tagId: value, companyId: t.id }, select: { id: true } });
      if (!exists) { await prisma.tagLink.create({ data: { tagId: value, companyId: t.id } }); added++; }
    }
    return { affected: added };
  }
  throw new Error("Unknown action.");
}

export interface CompanyImportRow {
  name?: string; industry?: string; website?: string; phone?: string; address?: string; city?: string; country?: string;
}

export async function importCompanies(ctx: TenantContext, rows: CompanyImportRow[]) {
  const limit = await getLeadLimit(ctx.organizationId);
  let count = limit == null ? 0 : await prisma.company.count({ where: { organizationId: ctx.organizationId } });
  let created = 0;
  let skipped = 0;
  const seen = new Set<string>();

  for (const r of rows) {
    const name = (r.name || "").trim();
    if (!name) { skipped++; continue; }
    const key = name.toLowerCase();
    if (seen.has(key)) { skipped++; continue; }
    const dupe = await prisma.company.findFirst({ where: { organizationId: ctx.organizationId, name }, select: { id: true } });
    if (dupe) { skipped++; continue; }
    if (limit != null && count >= limit) { skipped++; continue; } // plan cap

    await prisma.company.create({
      data: {
        organizationId: ctx.organizationId,
        name,
        industry: (r.industry || "").trim() || null,
        website: (r.website || "").trim() || null,
        phone: (r.phone || "").trim() || null,
        address: (r.address || "").trim() || null,
        city: (r.city || "").trim() || null,
        country: (r.country || "").trim() || null,
        source: "IMPORT",
        ownerId: ctx.userId,
      },
    });
    created++; count++; seen.add(key);
  }
  return { created, skipped, atCap: limit != null && count >= limit };
}

export async function deleteCompany(ctx: TenantContext, id: string) {
  const existing = await prisma.company.findFirst({
    where: { id, organizationId: ctx.organizationId },
    select: { id: true },
  });
  if (!existing) throw new Error("Company not found.");
  await prisma.company.delete({ where: { id } });
}
