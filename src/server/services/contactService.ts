import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { isOrgMember } from "@/server/orgGuards";
import { getTimeline } from "@/server/services/recordService";
import type { CreateContactInput, UpdateContactInput } from "@/lib/validations/contact";

export interface ContactFilters {
  q?: string;
  ownerId?: string;
  companyId?: string;
  lifecycleStage?: string;
  tagId?: string;
}

async function assertCompanyInOrg(ctx: TenantContext, companyId?: string) {
  if (!companyId) return;
  const c = await prisma.company.findFirst({
    where: { id: companyId, organizationId: ctx.organizationId },
    select: { id: true },
  });
  if (!c) throw new Error("Company not found in your organization.");
}

export async function listContacts(
  ctx: TenantContext,
  filters: ContactFilters,
  page = 1,
  pageSize = 20
) {
  const where = {
    organizationId: ctx.organizationId,
    ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
    ...(filters.companyId ? { companyId: filters.companyId } : {}),
    ...(filters.lifecycleStage ? { lifecycleStage: filters.lifecycleStage } : {}),
    ...(filters.tagId ? { tagLinks: { some: { tagId: filters.tagId } } } : {}),
    ...(filters.q
      ? {
          OR: [
            { firstName: { contains: filters.q } },
            { lastName: { contains: filters.q } },
            { email: { contains: filters.q } },
            { phone: { contains: filters.q } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        owner: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        tagLinks: { include: { tag: { select: { id: true, name: true, color: true } } } },
        _count: { select: { dealLinks: true } },
      },
    }),
    prisma.contact.count({ where }),
  ]);

  return {
    contacts: rows.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      title: c.title,
      lifecycleStage: c.lifecycleStage,
      leadScore: c.leadScore,
      company: c.company,
      owner: c.owner,
      tags: c.tagLinks.map((tl) => tl.tag),
      dealCount: c._count.dealLinks,
      createdAt: c.createdAt,
    })),
    total,
  };
}

export async function getContact(ctx: TenantContext, id: string) {
  const contact = await prisma.contact.findFirst({
    where: { id, organizationId: ctx.organizationId },
    include: {
      owner: { select: { id: true, name: true } },
      company: { select: { id: true, name: true, industry: true } },
      dealLinks: {
        include: {
          deal: { include: { stage: { select: { name: true, kind: true } } } },
        },
      },
      tagLinks: { include: { tag: { select: { id: true, name: true, color: true } } } },
    },
  });
  if (!contact) return null;

  const timeline = await getTimeline(ctx, { contactId: id });
  return {
    ...contact,
    deals: contact.dealLinks.map((dl) => dl.deal),
    timeline,
  };
}

export async function createContact(ctx: TenantContext, input: CreateContactInput) {
  if (!(await isOrgMember(ctx, input.ownerId))) {
    throw new Error("Owner must be a member of your organization.");
  }
  await assertCompanyInOrg(ctx, input.companyId);
  return prisma.contact.create({
    data: {
      organizationId: ctx.organizationId,
      source: "MANUAL",
      lifecycleStage: input.lifecycleStage ?? "LEAD",
      firstName: input.firstName,
      lastName: input.lastName ?? "",
      email: input.email,
      phone: input.phone,
      title: input.title,
      companyId: input.companyId,
      ownerId: input.ownerId,
    },
  });
}

export async function updateContact(ctx: TenantContext, id: string, input: UpdateContactInput) {
  const existing = await prisma.contact.findFirst({
    where: { id, organizationId: ctx.organizationId },
    select: { id: true },
  });
  if (!existing) throw new Error("Contact not found.");
  if (!(await isOrgMember(ctx, input.ownerId))) {
    throw new Error("Owner must be a member of your organization.");
  }
  await assertCompanyInOrg(ctx, input.companyId);
  return prisma.contact.update({ where: { id }, data: input });
}

export async function deleteContact(ctx: TenantContext, id: string) {
  const existing = await prisma.contact.findFirst({
    where: { id, organizationId: ctx.organizationId },
    select: { id: true },
  });
  if (!existing) throw new Error("Contact not found.");
  await prisma.contact.delete({ where: { id } });
}
