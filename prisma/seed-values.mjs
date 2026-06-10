// Sets demo deal values on the demo org's leads (only where missing). Run: node prisma/seed-values.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// name fragment -> deal value (USD)
const VALUES = {
  "Bright Smile": 1500,
  "FitZone": 2400,
  "Spice Route": 900,
  "Glow Beauty": 1200,
  "City Law": 5000,
  "QuickFix": 800,
  "Green Leaf": 3500,
  "Urban Cafe": 1800,
};

async function main() {
  const org = await prisma.organization.findUnique({ where: { slug: "demo-agency" } });
  if (!org) {
    console.log('No "demo-agency" org — run seed.mjs + seed-leads.mjs first.');
    return;
  }
  const leads = await prisma.lead.findMany({ where: { organizationId: org.id } });
  let updated = 0;
  for (const lead of leads) {
    if (lead.dealValue != null) continue;
    const match = Object.entries(VALUES).find(([frag]) => lead.name.includes(frag));
    const value = match ? match[1] : 1000;
    await prisma.lead.update({ where: { id: lead.id }, data: { dealValue: value } });
    updated++;
  }
  console.log(`Set deal values on ${updated} lead(s) in "${org.name}".`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
