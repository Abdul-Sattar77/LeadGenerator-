import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import type { RecordTarget } from "@/server/services/recordService";
import type { AttachTagInput, CreateTagInput } from "@/lib/validations/tag";

const PALETTE = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#ec4899", "#64748b"];

export async function listTags(ctx: TenantContext) {
  const tags = await prisma.tag.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { name: "asc" },
    include: { _count: { select: { links: true } } },
  });
  return tags.map((t) => ({ id: t.id, name: t.name, color: t.color, count: t._count.links }));
}

export async function createTag(ctx: TenantContext, input: CreateTagInput) {
  const color = input.color ?? PALETTE[input.name.length % PALETTE.length];
  return prisma.tag.upsert({
    where: { organizationId_name: { organizationId: ctx.organizationId, name: input.name } },
    update: {},
    create: { organizationId: ctx.organizationId, name: input.name, color },
  });
}

/** Attach a tag (existing or freshly-created) to a company/contact. Idempotent. */
export async function attachTag(ctx: TenantContext, target: RecordTarget, input: AttachTagInput) {
  let tagId = input.tagId;
  if (!tagId && input.name) {
    const tag = await createTag(ctx, { name: input.name, color: input.color });
    tagId = tag.id;
  }
  if (!tagId) throw new Error("No tag specified.");

  // Verify the tag belongs to this org.
  const tag = await prisma.tag.findFirst({ where: { id: tagId, organizationId: ctx.organizationId }, select: { id: true } });
  if (!tag) throw new Error("Tag not found.");

  const existing = await prisma.tagLink.findFirst({
    where: { tagId, companyId: target.companyId ?? null, contactId: target.contactId ?? null },
    select: { id: true },
  });
  if (!existing) {
    await prisma.tagLink.create({
      data: { tagId, companyId: target.companyId ?? null, contactId: target.contactId ?? null },
    });
  }
  return { tagId };
}

export async function detachTag(ctx: TenantContext, target: RecordTarget, tagId: string) {
  await prisma.tagLink.deleteMany({
    where: {
      tagId,
      companyId: target.companyId ?? undefined,
      contactId: target.contactId ?? undefined,
      tag: { organizationId: ctx.organizationId },
    },
  });
}
