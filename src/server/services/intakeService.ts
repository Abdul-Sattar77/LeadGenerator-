import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { getLeadLimit } from "@/server/services/billingService";
import { logActivity } from "@/server/services/recordService";
import { PlanLimitError } from "@/lib/plans";
import type { DiscoverSaveInput } from "@/lib/validations/intake";

/**
 * Save a business discovered on Google Maps into the relational CRM as a
 * Company. Idempotent per org by (name + address) so "Save to CRM" can be
 * clicked repeatedly. This replaces the legacy Lead intake.
 */
export async function saveDiscoveredCompany(ctx: TenantContext, input: DiscoverSaveInput) {
  const org = ctx.organizationId;

  const existing = await prisma.company.findFirst({
    where: { organizationId: org, name: input.name, ...(input.address ? { address: input.address } : {}) },
    select: { id: true, name: true },
  });
  if (existing) return { id: existing.id, name: existing.name, created: false };

  // Enforce the plan's record cap (Free tier).
  const limit = await getLeadLimit(org);
  if (limit != null) {
    const count = await prisma.company.count({ where: { organizationId: org } });
    if (count >= limit) throw new PlanLimitError(limit);
  }

  const customData =
    input.rating != null || input.reviews != null
      ? JSON.stringify({ rating: input.rating ?? null, reviews: input.reviews ?? null })
      : null;

  const company = await prisma.company.create({
    data: {
      organizationId: org,
      name: input.name,
      phone: input.phone,
      website: input.website,
      address: input.address,
      industry: input.category,
      source: input.source || "GOOGLE_MAPS",
      ownerId: ctx.userId,
      customData,
    },
  });

  await logActivity(ctx, "COMPANY_CREATED", { companyId: company.id }, { name: company.name, via: "discover" });
  return { id: company.id, name: company.name, created: true };
}
