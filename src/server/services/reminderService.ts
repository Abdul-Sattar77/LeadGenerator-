import { prisma } from "@/server/db";
import { sendEmail, appUrl } from "@/lib/email";

// Finds follow-up reminders whose time has arrived and emails (+ in-app notifies)
// the assignee, once. Runs as a system job (no tenant context) via the cron route.
export async function runDueReminders(): Promise<{ processed: number; emailed: number }> {
  const now = new Date();
  const due = await prisma.task.findMany({
    where: {
      status: { not: "COMPLETED" },
      dueDate: { lte: now },
      remindedAt: null,
      assignedUserId: { not: null },
    },
    include: {
      assignedUser: { select: { id: true, email: true, name: true } },
      lead: { select: { id: true, name: true } },
    },
    take: 200,
  });

  let emailed = 0;
  for (const t of due) {
    const leadPart = t.lead ? ` for ${t.lead.name}` : "";
    const link = `${appUrl()}${t.leadId ? `/app/leads/${t.leadId}` : "/app/tasks"}`;

    if (t.assignedUser?.email) {
      const res = await sendEmail({
        to: t.assignedUser.email,
        subject: `Reminder: ${t.title}`,
        html:
          `<p>Hi ${t.assignedUser.name || "there"},</p>` +
          `<p>This is your follow-up reminder${leadPart}:</p>` +
          `<p style="font-size:16px"><strong>${t.title}</strong></p>` +
          `<p><a href="${link}">Open in LeadFinder →</a></p>`,
      });
      if (!res.error) emailed++;
    }

    if (t.assignedUserId) {
      await prisma.notification.create({
        data: {
          organizationId: t.organizationId,
          userId: t.assignedUserId,
          type: "FOLLOW_UP",
          title: `Reminder: ${t.title}`,
          body: leadPart.trim(),
          link: t.leadId ? `/app/leads/${t.leadId}` : "/app/tasks",
        },
      });
    }

    await prisma.task.update({ where: { id: t.id }, data: { remindedAt: now } });
  }

  return { processed: due.length, emailed };
}
