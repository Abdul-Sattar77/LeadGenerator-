// Seeds a demo campaign for the demo org (idempotent). Run: node prisma/seed-campaigns.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findUnique({ where: { slug: "demo-agency" } });
  if (!org) return console.log('No "demo-agency" org — run seed.mjs first.');

  const existing = await prisma.campaign.count({ where: { organizationId: org.id } });
  if (existing > 0) return console.log(`Demo org already has ${existing} campaign(s) — skipping.`);

  const admin = await prisma.user.findFirst({ where: { organizationId: org.id, role: "ADMIN" } });
  const campaign = await prisma.campaign.create({
    data: {
      organizationId: org.id,
      name: "Karachi Outreach Q2",
      description: "Top local businesses to pitch website + ads services this quarter.",
      status: "RUNNING",
      createdById: admin?.id ?? null,
    },
  });

  // Attach the 4 highest-scoring unassigned-to-campaign leads.
  const leads = await prisma.lead.findMany({
    where: { organizationId: org.id, campaignId: null },
    orderBy: { leadScore: "desc" },
    take: 4,
  });
  if (leads.length) {
    await prisma.lead.updateMany({
      where: { id: { in: leads.map((l) => l.id) } },
      data: { campaignId: campaign.id },
    });
  }
  console.log(`Seeded campaign "${campaign.name}" with ${leads.length} leads.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
