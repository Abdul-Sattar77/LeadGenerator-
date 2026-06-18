import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { sendToContact } from "@/server/services/emailService";

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export async function listSequences(ctx: TenantContext) {
  const rows = await prisma.sequence.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { steps: true, enrollments: true } } },
  });
  // Active enrollment counts in one grouped query.
  const ids = rows.map((r) => r.id);
  const active = ids.length
    ? await prisma.sequenceEnrollment.groupBy({ by: ["sequenceId"], where: { sequenceId: { in: ids }, status: "ACTIVE" }, _count: { _all: true } })
    : [];
  const activeMap = new Map(active.map((a) => [a.sequenceId, a._count._all]));
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    stepCount: s._count.steps,
    enrolledCount: s._count.enrollments,
    activeCount: activeMap.get(s.id) ?? 0,
    createdAt: s.createdAt.toISOString(),
  }));
}

export async function getSequence(ctx: TenantContext, id: string) {
  const seq = await prisma.sequence.findFirst({
    where: { id, organizationId: ctx.organizationId },
    include: {
      steps: { orderBy: { order: "asc" } },
      enrollments: {
        orderBy: { enrolledAt: "desc" },
        take: 100,
        include: { contact: { select: { id: true, firstName: true, lastName: true, email: true } } },
      },
    },
  });
  if (!seq) return null;
  return {
    id: seq.id,
    name: seq.name,
    status: seq.status,
    steps: seq.steps.map((s) => ({ id: s.id, order: s.order, dayOffset: s.dayOffset, subject: s.subject, body: s.body })),
    enrollments: seq.enrollments.map((e) => ({
      id: e.id,
      status: e.status,
      currentStep: e.currentStep,
      nextRunAt: e.nextRunAt?.toISOString() ?? null,
      stoppedReason: e.stoppedReason,
      contact: { id: e.contact.id, name: `${e.contact.firstName} ${e.contact.lastName}`.trim(), email: e.contact.email },
    })),
  };
}

export async function createSequence(ctx: TenantContext, name: string) {
  return prisma.sequence.create({ data: { organizationId: ctx.organizationId, name, createdById: ctx.userId } });
}

export async function updateSequence(ctx: TenantContext, id: string, data: { name?: string; status?: string }) {
  const res = await prisma.sequence.updateMany({ where: { id, organizationId: ctx.organizationId }, data });
  if (!res.count) throw new Error("Sequence not found.");
}

export async function deleteSequence(ctx: TenantContext, id: string) {
  const res = await prisma.sequence.deleteMany({ where: { id, organizationId: ctx.organizationId } });
  if (!res.count) throw new Error("Sequence not found.");
}

/** Replace all steps of a sequence (the editor saves the whole list). */
export async function saveSteps(
  ctx: TenantContext,
  id: string,
  steps: { dayOffset: number; subject: string; body: string }[]
) {
  const seq = await prisma.sequence.findFirst({ where: { id, organizationId: ctx.organizationId }, select: { id: true } });
  if (!seq) throw new Error("Sequence not found.");
  await prisma.$transaction([
    prisma.sequenceStep.deleteMany({ where: { sequenceId: id } }),
    prisma.sequenceStep.createMany({
      data: steps.map((s, i) => ({ sequenceId: id, order: i, dayOffset: s.dayOffset, subject: s.subject, body: s.body })),
    }),
  ]);
}

/** Enroll contacts into a sequence; schedules step 1 by its dayOffset. */
export async function enrollContacts(ctx: TenantContext, id: string, contactIds: string[]) {
  const seq = await prisma.sequence.findFirst({
    where: { id, organizationId: ctx.organizationId },
    include: { steps: { orderBy: { order: "asc" }, take: 1 } },
  });
  if (!seq) throw new Error("Sequence not found.");
  if (seq.steps.length === 0) throw new Error("Add at least one step before enrolling.");

  const firstOffset = seq.steps[0].dayOffset;
  const now = new Date();
  let enrolled = 0;
  for (const contactId of contactIds) {
    const contact = await prisma.contact.findFirst({ where: { id: contactId, organizationId: ctx.organizationId }, select: { id: true } });
    if (!contact) continue;
    const exists = await prisma.sequenceEnrollment.findUnique({ where: { sequenceId_contactId: { sequenceId: id, contactId } }, select: { id: true } });
    if (exists) continue;
    await prisma.sequenceEnrollment.create({
      data: {
        organizationId: ctx.organizationId,
        sequenceId: id,
        contactId,
        enrolledById: ctx.userId,
        currentStep: 0,
        nextRunAt: addDays(now, firstOffset),
      },
    });
    enrolled++;
  }
  return { enrolled };
}

export async function stopEnrollment(ctx: TenantContext, enrollmentId: string) {
  await prisma.sequenceEnrollment.updateMany({
    where: { id: enrollmentId, organizationId: ctx.organizationId },
    data: { status: "STOPPED", stoppedReason: "Stopped manually", nextRunAt: null },
  });
}

/**
 * System job (run by cron): send the due step for each active enrollment,
 * then schedule the next step or complete. One step per enrollment per run.
 */
export async function runDueSequences(): Promise<{ processed: number; sent: number }> {
  const now = new Date();
  const due = await prisma.sequenceEnrollment.findMany({
    where: { status: "ACTIVE", nextRunAt: { lte: now } },
    include: { sequence: { include: { steps: { orderBy: { order: "asc" } } } } },
    take: 200,
  });

  let sent = 0;
  for (const e of due) {
    if (e.sequence.status !== "ACTIVE") continue; // paused → hold
    const steps = e.sequence.steps;
    const step = steps[e.currentStep];
    if (!step) {
      await prisma.sequenceEnrollment.update({ where: { id: e.id }, data: { status: "COMPLETED", nextRunAt: null } });
      continue;
    }

    // Build a minimal tenant context to send as the enroller.
    const ctx = { userId: e.enrolledById ?? "", organizationId: e.organizationId, role: "SALES_REP", name: "", email: "" } as TenantContext;
    const res = await sendToContact(ctx, { contactId: e.contactId, subject: step.subject, body: step.body });

    if (!res.ok) {
      await prisma.sequenceEnrollment.update({ where: { id: e.id }, data: { status: "STOPPED", stoppedReason: res.error, nextRunAt: null } });
      continue;
    }
    sent++;

    const nextIdx = e.currentStep + 1;
    const next = steps[nextIdx];
    await prisma.sequenceEnrollment.update({
      where: { id: e.id },
      data: next
        ? { currentStep: nextIdx, nextRunAt: addDays(e.enrolledAt, next.dayOffset) }
        : { currentStep: nextIdx, status: "COMPLETED", nextRunAt: null },
    });
  }

  return { processed: due.length, sent };
}
