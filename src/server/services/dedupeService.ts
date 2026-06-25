import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";

/** Find duplicate groups: companies by name, contacts by email. */
export async function findDuplicates(ctx: TenantContext) {
  const org = ctx.organizationId;
  const [companies, contacts] = await Promise.all([
    prisma.company.findMany({ where: { organizationId: org }, select: { id: true, name: true, createdAt: true }, orderBy: { createdAt: "asc" } }),
    prisma.contact.findMany({ where: { organizationId: org, email: { not: null } }, select: { id: true, firstName: true, lastName: true, email: true, createdAt: true }, orderBy: { createdAt: "asc" } }),
  ]);

  const groupBy = <T>(items: T[], keyOf: (x: T) => string) => {
    const m = new Map<string, T[]>();
    for (const it of items) {
      const k = keyOf(it).trim().toLowerCase();
      if (!k) continue;
      (m.get(k) ?? m.set(k, []).get(k)!).push(it);
    }
    return [...m.values()].filter((g) => g.length > 1);
  };

  const companyGroups = groupBy(companies, (c) => c.name).map((g) => ({
    key: g[0].name,
    records: g.map((c) => ({ id: c.id, label: c.name })),
  }));
  const contactGroups = groupBy(contacts, (c) => c.email ?? "").map((g) => ({
    key: g[0].email ?? "",
    records: g.map((c) => ({ id: c.id, label: `${c.firstName} ${c.lastName}`.trim() || c.email || "—" })),
  }));

  return { companies: companyGroups, contacts: contactGroups };
}

export async function mergeContacts(ctx: TenantContext, survivorId: string, dupId: string) {
  if (survivorId === dupId) throw new Error("Can't merge a record into itself.");
  const org = ctx.organizationId;
  const [survivor, dup] = await Promise.all([
    prisma.contact.findFirst({ where: { id: survivorId, organizationId: org } }),
    prisma.contact.findFirst({ where: { id: dupId, organizationId: org } }),
  ]);
  if (!survivor || !dup) throw new Error("Contact not found.");

  // Reassign simple relations.
  await prisma.deal.updateMany({ where: { primaryContactId: dupId, organizationId: org }, data: { primaryContactId: survivorId } });
  await prisma.task.updateMany({ where: { contactId: dupId, organizationId: org }, data: { contactId: survivorId } });
  await prisma.note.updateMany({ where: { contactId: dupId, organizationId: org }, data: { contactId: survivorId } });
  await prisma.activity.updateMany({ where: { contactId: dupId, organizationId: org }, data: { contactId: survivorId } });
  await prisma.emailMessage.updateMany({ where: { contactId: dupId, organizationId: org }, data: { contactId: survivorId } });
  await prisma.tagLink.updateMany({ where: { contactId: dupId }, data: { contactId: survivorId } });

  // Unique-constrained join rows: move unless the survivor already has one.
  for (const dc of await prisma.dealContact.findMany({ where: { contactId: dupId } })) {
    const exists = await prisma.dealContact.findUnique({ where: { dealId_contactId: { dealId: dc.dealId, contactId: survivorId } } });
    if (exists) await prisma.dealContact.delete({ where: { dealId_contactId: { dealId: dc.dealId, contactId: dupId } } });
    else await prisma.dealContact.update({ where: { dealId_contactId: { dealId: dc.dealId, contactId: dupId } }, data: { contactId: survivorId } });
  }
  for (const en of await prisma.sequenceEnrollment.findMany({ where: { contactId: dupId } })) {
    const exists = await prisma.sequenceEnrollment.findUnique({ where: { sequenceId_contactId: { sequenceId: en.sequenceId, contactId: survivorId } } });
    if (exists) await prisma.sequenceEnrollment.delete({ where: { id: en.id } });
    else await prisma.sequenceEnrollment.update({ where: { id: en.id }, data: { contactId: survivorId } });
  }

  // Backfill blank survivor fields from the duplicate.
  await prisma.contact.update({
    where: { id: survivorId },
    data: {
      email: survivor.email ?? dup.email,
      phone: survivor.phone ?? dup.phone,
      title: survivor.title ?? dup.title,
      companyId: survivor.companyId ?? dup.companyId,
      leadScore: Math.max(survivor.leadScore, dup.leadScore),
    },
  });
  await prisma.contact.delete({ where: { id: dupId } });
}

export async function mergeCompanies(ctx: TenantContext, survivorId: string, dupId: string) {
  if (survivorId === dupId) throw new Error("Can't merge a record into itself.");
  const org = ctx.organizationId;
  const [survivor, dup] = await Promise.all([
    prisma.company.findFirst({ where: { id: survivorId, organizationId: org } }),
    prisma.company.findFirst({ where: { id: dupId, organizationId: org } }),
  ]);
  if (!survivor || !dup) throw new Error("Company not found.");

  await prisma.contact.updateMany({ where: { companyId: dupId, organizationId: org }, data: { companyId: survivorId } });
  await prisma.deal.updateMany({ where: { companyId: dupId, organizationId: org }, data: { companyId: survivorId } });
  await prisma.task.updateMany({ where: { companyId: dupId, organizationId: org }, data: { companyId: survivorId } });
  await prisma.note.updateMany({ where: { companyId: dupId, organizationId: org }, data: { companyId: survivorId } });
  await prisma.activity.updateMany({ where: { companyId: dupId, organizationId: org }, data: { companyId: survivorId } });
  await prisma.tagLink.updateMany({ where: { companyId: dupId }, data: { companyId: survivorId } });

  await prisma.company.update({
    where: { id: survivorId },
    data: {
      domain: survivor.domain ?? dup.domain,
      website: survivor.website ?? dup.website,
      phone: survivor.phone ?? dup.phone,
      industry: survivor.industry ?? dup.industry,
      address: survivor.address ?? dup.address,
      city: survivor.city ?? dup.city,
      country: survivor.country ?? dup.country,
      ownerId: survivor.ownerId ?? dup.ownerId,
    },
  });
  await prisma.company.delete({ where: { id: dupId } });
}
