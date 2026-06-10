// Seeds demo tasks into the demo org (idempotent). Run: node prisma/seed-tasks.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function daysFromNow(n) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  const org = await prisma.organization.findUnique({ where: { slug: "demo-agency" } });
  if (!org) return console.log('No "demo-agency" org — run seed.mjs first.');

  const existing = await prisma.task.count({ where: { organizationId: org.id } });
  if (existing > 0) return console.log(`Demo org already has ${existing} tasks — skipping.`);

  const admin = await prisma.user.findFirst({ where: { organizationId: org.id, role: "ADMIN" } });
  const leads = await prisma.lead.findMany({ where: { organizationId: org.id }, take: 4 });
  const leadId = (i) => leads[i]?.id ?? null;

  const TASKS = [
    { title: "Call Bright Smile Dental about redesign", type: "CALL", priority: "HIGH", dueDate: daysFromNow(0), leadId: leadId(0) },
    { title: "Send proposal to City Law Associates", type: "EMAIL", priority: "URGENT", dueDate: daysFromNow(-2), leadId: leadId(1) },
    { title: "Demo meeting with Green Leaf Clinic", type: "MEETING", priority: "MEDIUM", dueDate: daysFromNow(3), leadId: leadId(2) },
    { title: "Follow up with FitZone Gym", type: "REMINDER", priority: "LOW", dueDate: daysFromNow(0), leadId: leadId(3) },
    { title: "Thank-you note to Urban Cafe (won)", type: "EMAIL", priority: "LOW", dueDate: daysFromNow(-5), status: "COMPLETED", completedAt: daysFromNow(-5) },
  ];

  for (const t of TASKS) {
    await prisma.task.create({
      data: {
        organizationId: org.id,
        title: t.title,
        type: t.type,
        priority: t.priority,
        status: t.status ?? "PENDING",
        dueDate: t.dueDate,
        completedAt: t.completedAt ?? null,
        assignedUserId: admin?.id ?? null,
        createdById: admin?.id ?? null,
        leadId: t.leadId ?? null,
      },
    });
  }
  console.log(`Seeded ${TASKS.length} demo tasks into "${org.name}".`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
