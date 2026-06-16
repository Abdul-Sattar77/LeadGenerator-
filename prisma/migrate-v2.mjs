// One-time migration: legacy Lead -> relational Company + Contact + Deal.
// Idempotent at the org level (skips orgs that already have companies).
// Run: node prisma/migrate-v2.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CANONICAL_STAGES = [
  { name: "New", order: 0, probability: 10, kind: "OPEN", color: "#94a3b8" },
  { name: "Qualified", order: 1, probability: 25, kind: "OPEN", color: "#6366f1" },
  { name: "Proposal", order: 2, probability: 50, kind: "OPEN", color: "#a855f7" },
  { name: "Negotiation", order: 3, probability: 70, kind: "OPEN", color: "#f59e0b" },
  { name: "Won", order: 4, probability: 100, kind: "WON", color: "#10b981" },
  { name: "Lost", order: 5, probability: 0, kind: "LOST", color: "#ef4444" },
];

function kindForName(name) {
  const n = name.toLowerCase();
  if (n.includes("won")) return "WON";
  if (n.includes("lost")) return "LOST";
  return "OPEN";
}

async function ensurePipeline(orgId) {
  let pipeline = await prisma.pipeline.findFirst({
    where: { organizationId: orgId },
    include: { stages: { orderBy: { order: "asc" } } },
  });
  if (!pipeline) {
    pipeline = await prisma.pipeline.create({
      data: {
        organizationId: orgId,
        name: "Sales Pipeline",
        isDefault: true,
        stages: { create: CANONICAL_STAGES },
      },
      include: { stages: { orderBy: { order: "asc" } } },
    });
  } else if (pipeline.stages.length === 0) {
    await prisma.pipelineStage.createMany({ data: CANONICAL_STAGES.map((s) => ({ ...s, pipelineId: pipeline.id })) });
    pipeline = await prisma.pipeline.findUnique({ where: { id: pipeline.id }, include: { stages: { orderBy: { order: "asc" } } } });
  } else {
    // Mark terminal stages so deals know which are Won/Lost.
    for (const st of pipeline.stages) {
      await prisma.pipelineStage.update({ where: { id: st.id }, data: { kind: kindForName(st.name) } });
    }
    pipeline = await prisma.pipeline.findUnique({ where: { id: pipeline.id }, include: { stages: { orderBy: { order: "asc" } } } });
  }
  return pipeline;
}

function pickStage(stages, status) {
  const byKind = (k) => stages.find((s) => s.kind === k);
  if (status === "WON") return byKind("WON") ?? stages[stages.length - 1];
  if (status === "LOST") return byKind("LOST") ?? stages[stages.length - 1];
  const open = stages.filter((s) => s.kind === "OPEN");
  const map = { NEW: 0, CONTACTED: 0, QUALIFIED: 1, INTERESTED: 1, PROPOSAL_SENT: 2, NEGOTIATION: 3 };
  return open[map[status] ?? 0] ?? open[0] ?? stages[0];
}

function lifecycleFor(status) {
  if (status === "WON") return "CUSTOMER";
  if (["QUALIFIED", "INTERESTED", "PROPOSAL_SENT", "NEGOTIATION"].includes(status)) return "QUALIFIED";
  return "LEAD";
}

async function main() {
  const orgs = await prisma.organization.findMany({ select: { id: true, name: true } });
  let totals = { companies: 0, contacts: 0, deals: 0 };

  for (const org of orgs) {
    const existing = await prisma.company.count({ where: { organizationId: org.id } });
    if (existing > 0) { console.log(`• ${org.name}: already migrated (${existing} companies) — skipping`); continue; }

    const leads = await prisma.lead.findMany({ where: { organizationId: org.id } });
    if (leads.length === 0) { console.log(`• ${org.name}: no leads`); continue; }

    const pipeline = await ensurePipeline(org.id);

    for (const lead of leads) {
      const company = await prisma.company.create({
        data: {
          organizationId: org.id,
          name: lead.name,
          website: lead.website || null,
          phone: lead.phone || null,
          industry: lead.industry || lead.category || null,
          address: lead.address || null,
          ownerId: lead.assignedUserId || null,
          source: lead.source || "GOOGLE_MAPS",
          customData: lead.customData || null,
        },
      });
      totals.companies++;

      const contact = await prisma.contact.create({
        data: {
          organizationId: org.id,
          companyId: company.id,
          firstName: lead.contactPerson?.trim() || lead.name,
          lastName: "",
          email: lead.email || null,
          phone: lead.phone || null,
          ownerId: lead.assignedUserId || null,
          source: lead.source || "GOOGLE_MAPS",
          lifecycleStage: lifecycleFor(lead.status),
          leadScore: lead.leadScore || 0,
          customData: lead.customData || null,
        },
      });
      totals.contacts++;

      const value = lead.dealValue != null ? Number(lead.dealValue) : 0;
      const makeDeal = value > 0 || ["QUALIFIED", "INTERESTED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"].includes(lead.status);
      if (makeDeal) {
        const stage = pickStage(pipeline.stages, lead.status);
        const deal = await prisma.deal.create({
          data: {
            organizationId: org.id,
            name: `${lead.name} — opportunity`,
            value: lead.dealValue ?? null,
            pipelineId: pipeline.id,
            stageId: stage.id,
            status: lead.status === "WON" ? "WON" : lead.status === "LOST" ? "LOST" : "OPEN",
            companyId: company.id,
            primaryContactId: contact.id,
            ownerId: lead.assignedUserId || null,
            source: lead.source || "GOOGLE_MAPS",
            wonAt: lead.wonAt || null,
            expectedCloseDate: lead.expectedCloseDate || null,
          },
        });
        await prisma.dealContact.create({ data: { dealId: deal.id, contactId: contact.id, role: "Primary" } });
        totals.deals++;
      }
    }
    console.log(`• ${org.name}: migrated ${leads.length} leads`);
  }

  console.log(`\nDone. Created ${totals.companies} companies, ${totals.contacts} contacts, ${totals.deals} deals.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
