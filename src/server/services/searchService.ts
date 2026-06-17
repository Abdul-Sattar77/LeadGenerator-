import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";

export interface SearchResults {
  companies: { id: string; name: string; subtitle: string | null }[];
  contacts: { id: string; name: string; subtitle: string | null }[];
  deals: { id: string; name: string; subtitle: string | null }[];
}

/** Global quick-search across the relational entities (for the ⌘K palette). */
export async function searchAll(ctx: TenantContext, q: string): Promise<SearchResults> {
  const term = q.trim();
  if (!term) return { companies: [], contacts: [], deals: [] };
  const org = ctx.organizationId;

  const [companies, contacts, deals] = await Promise.all([
    prisma.company.findMany({
      where: { organizationId: org, OR: [{ name: { contains: term } }, { domain: { contains: term } }] },
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, industry: true, city: true },
    }),
    prisma.contact.findMany({
      where: {
        organizationId: org,
        OR: [{ firstName: { contains: term } }, { lastName: { contains: term } }, { email: { contains: term } }],
      },
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: { id: true, firstName: true, lastName: true, email: true, company: { select: { name: true } } },
    }),
    prisma.deal.findMany({
      where: { organizationId: org, name: { contains: term } },
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: { stage: { select: { name: true } }, company: { select: { name: true } } },
    }),
  ]);

  return {
    companies: companies.map((c) => ({ id: c.id, name: c.name, subtitle: c.industry || c.city || null })),
    contacts: contacts.map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`.trim(),
      subtitle: c.company?.name || c.email || null,
    })),
    deals: deals.map((d) => ({ id: d.id, name: d.name, subtitle: d.company?.name || d.stage?.name || null })),
  };
}
