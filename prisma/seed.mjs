// Seeds a demo organization + admin user (idempotent). Run: node prisma/seed.mjs
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@leadfinder.test";
const DEMO_PASSWORD = "demo12345";

const STAGES = [
  ["New", "#94a3b8"],
  ["Contacted", "#3b82f6"],
  ["Qualified", "#6366f1"],
  ["Interested", "#f59e0b"],
  ["Proposal", "#a855f7"],
  ["Negotiation", "#ec4899"],
  ["Won", "#10b981"],
  ["Lost", "#ef4444"],
];

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    console.log(`Demo user already exists: ${DEMO_EMAIL}`);
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const org = await prisma.organization.create({
    data: {
      name: "Demo Agency",
      slug: "demo-agency",
      subscription: { create: { plan: "PRO", status: "ACTIVE" } },
      pipelines: {
        create: {
          name: "Sales Pipeline",
          isDefault: true,
          stages: { create: STAGES.map(([name, color], order) => ({ name, color, order })) },
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      organizationId: org.id,
      email: DEMO_EMAIL,
      name: "Demo Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Seeded demo workspace:");
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
