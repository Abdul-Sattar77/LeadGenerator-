// Seeds demo leads into the "demo-agency" org (idempotent). Run: node prisma/seed-leads.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

// Mirrors src/lib/scoring.ts (kept inline so this plain-JS script needs no build step).
const INDUSTRY_WEIGHT = { dentist: 12, restaurant: 8, gym: 9, salon: 8, clinic: 11, lawyer: 10 };
function scoreLead({ website, rating = 0, reviews = 0, industry = "" }) {
  const hasWebsite = Boolean(website && website !== "—");
  const ind = (industry || "").toLowerCase();
  const breakdown = {
    website: hasWebsite ? 20 : 0,
    rating: rating >= 4.5 ? 20 : rating >= 4 ? 14 : rating >= 3 ? 7 : 0,
    reviews: reviews >= 200 ? 20 : reviews >= 50 ? 12 : reviews >= 10 ? 6 : 0,
    industry: INDUSTRY_WEIGHT[ind] ?? 5,
    activity: 0,
  };
  const score = clamp(Object.values(breakdown).reduce((a, b) => a + b, 0), 0, 100);
  return { score, breakdown };
}

const LEADS = [
  { name: "Bright Smile Dental", category: "Dentist", industry: "dentist", phone: "0311 2456789", website: "", address: "Clifton, Karachi", rating: 4.7, reviews: 86, status: "NEW", contactPerson: "Dr. Sana" },
  { name: "FitZone Gym", category: "Gym", industry: "gym", phone: "0321 9988776", website: "fitzone.pk", address: "DHA Phase 5, Karachi", rating: 4.2, reviews: 142, status: "CONTACTED", contactPerson: "Imran" },
  { name: "Spice Route Restaurant", category: "Restaurant", industry: "restaurant", phone: "021 35870011", website: "", address: "Tariq Road, Karachi", rating: 3.9, reviews: 38, status: "QUALIFIED", contactPerson: "Bilal" },
  { name: "Glow Beauty Salon", category: "Salon", industry: "salon", phone: "0300 1122334", website: "", address: "Bahadurabad, Karachi", rating: 4.8, reviews: 12, status: "INTERESTED", contactPerson: "Ayesha" },
  { name: "City Law Associates", category: "Law Firm", industry: "lawyer", phone: "021 34567890", website: "citylaw.com.pk", address: "Saddar, Karachi", rating: 4.5, reviews: 210, status: "PROPOSAL_SENT", contactPerson: "Adv. Kamran" },
  { name: "QuickFix Auto", category: "Auto Repair", industry: "auto", phone: "0345 5566778", website: "", address: "Korangi, Karachi", rating: 4.0, reviews: 64, status: "NEW", contactPerson: "" },
  { name: "Green Leaf Clinic", category: "Clinic", industry: "clinic", phone: "021 38901234", website: "greenleafclinic.pk", address: "Gulshan, Karachi", rating: 4.6, reviews: 175, status: "NEGOTIATION", contactPerson: "Dr. Faraz" },
  { name: "Urban Cafe", category: "Cafe", industry: "restaurant", phone: "0333 4455667", website: "", address: "Zamzama, Karachi", rating: 4.3, reviews: 320, status: "WON", contactPerson: "Hina" },
];

async function main() {
  const org = await prisma.organization.findUnique({ where: { slug: "demo-agency" } });
  if (!org) {
    console.log('No "demo-agency" org found — run `node prisma/seed.mjs` first.');
    return;
  }
  const existing = await prisma.lead.count({ where: { organizationId: org.id } });
  if (existing > 0) {
    console.log(`Demo org already has ${existing} leads — skipping.`);
    return;
  }
  const admin = await prisma.user.findFirst({ where: { organizationId: org.id, role: "ADMIN" } });

  for (const l of LEADS) {
    const { score, breakdown } = scoreLead(l);
    await prisma.lead.create({
      data: {
        organizationId: org.id,
        assignedUserId: admin?.id ?? null,
        key: `${l.name}|${l.address}`.toLowerCase() + `|${org.id}`,
        name: l.name,
        category: l.category,
        industry: l.industry,
        phone: l.phone,
        website: l.website,
        address: l.address,
        contactPerson: l.contactPerson,
        rating: l.rating,
        reviews: l.reviews,
        source: "GOOGLE_MAPS",
        status: l.status,
        leadScore: score,
        scoreBreakdown: JSON.stringify(breakdown),
      },
    });
  }
  console.log(`Seeded ${LEADS.length} demo leads into "${org.name}".`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
