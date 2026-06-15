import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";

export type FieldDef = { key: string; label: string };

export async function getCustomFieldDefs(ctx: TenantContext): Promise<FieldDef[]> {
  const org = await prisma.organization.findUnique({
    where: { id: ctx.organizationId },
    select: { customFieldDefs: true },
  });
  try {
    return org?.customFieldDefs ? (JSON.parse(org.customFieldDefs) as FieldDef[]) : [];
  } catch {
    return [];
  }
}

function slug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 30) || "field";
}

export async function setCustomFieldDefs(ctx: TenantContext, defs: { key?: string; label: string }[]): Promise<FieldDef[]> {
  const clean: FieldDef[] = [];
  const seen = new Set<string>();
  for (const d of defs) {
    const label = (d.label || "").trim();
    if (!label) continue;
    let key = (d.key || "").trim() || slug(label);
    while (seen.has(key)) key += "_";
    seen.add(key);
    clean.push({ key, label });
  }
  await prisma.organization.update({
    where: { id: ctx.organizationId },
    data: { customFieldDefs: JSON.stringify(clean) },
  });
  return clean;
}
