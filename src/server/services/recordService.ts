import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";

export type RecordTarget = { companyId?: string; contactId?: string; dealId?: string };

export interface TimelineItem {
  id: string;
  kind: "activity" | "note";
  type: string; // activity type, or "NOTE_ADDED"
  body: string | null;
  metadata: Record<string, unknown> | null;
  userId: string | null;
  userName: string | null;
  createdAt: Date;
}

function parseJson(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/** Write an activity event onto a record (CALL, EMAIL, STAGE_CHANGED, …). */
export async function logActivity(
  ctx: TenantContext,
  type: string,
  target: RecordTarget,
  metadata?: Record<string, unknown>
) {
  return prisma.activity.create({
    data: {
      organizationId: ctx.organizationId,
      type,
      userId: ctx.userId,
      companyId: target.companyId ?? null,
      contactId: target.contactId ?? null,
      dealId: target.dealId ?? null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

/** Add a note to a record + log a NOTE_ADDED activity for the timeline. */
export async function addNote(ctx: TenantContext, target: RecordTarget, body: string) {
  const note = await prisma.note.create({
    data: {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      body,
      companyId: target.companyId ?? null,
      contactId: target.contactId ?? null,
      dealId: target.dealId ?? null,
    },
  });
  await logActivity(ctx, "NOTE_ADDED", target, { noteId: note.id });
  return note;
}

/** Build a unified, newest-first timeline (activities + notes) for a record. */
export async function getTimeline(ctx: TenantContext, target: RecordTarget): Promise<TimelineItem[]> {
  const where = {
    organizationId: ctx.organizationId,
    ...(target.companyId ? { companyId: target.companyId } : {}),
    ...(target.contactId ? { contactId: target.contactId } : {}),
    ...(target.dealId ? { dealId: target.dealId } : {}),
  };

  const [activities, notes] = await Promise.all([
    prisma.activity.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.note.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  // Resolve user names in one query.
  const userIds = [...new Set([...activities, ...notes].map((r) => r.userId).filter(Boolean))] as string[];
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
    : [];
  const nameOf = new Map(users.map((u) => [u.id, u.name]));

  // Notes appear as their own timeline entries; the NOTE_ADDED activity is the
  // pointer, so we drop those activity rows to avoid duplicates.
  const items: TimelineItem[] = [
    ...activities
      .filter((a) => a.type !== "NOTE_ADDED")
      .map((a) => ({
        id: a.id,
        kind: "activity" as const,
        type: a.type,
        body: null,
        metadata: parseJson(a.metadata),
        userId: a.userId,
        userName: a.userId ? nameOf.get(a.userId) ?? null : null,
        createdAt: a.createdAt,
      })),
    ...notes.map((n) => ({
      id: n.id,
      kind: "note" as const,
      type: "NOTE_ADDED",
      body: n.body,
      metadata: null,
      userId: n.userId,
      userName: n.userId ? nameOf.get(n.userId) ?? null : null,
      createdAt: n.createdAt,
    })),
  ];

  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
