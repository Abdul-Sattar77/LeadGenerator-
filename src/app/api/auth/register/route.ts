import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/db";
import { registerSchema } from "@/lib/validations/auth";
import { requestVerification } from "@/server/services/verifyService";

export const dynamic = "force-dynamic";

// Default Kanban pipeline created for every new organization.
const DEFAULT_STAGES = [
  { name: "New", color: "#94a3b8", probability: 10, kind: "OPEN" },
  { name: "Contacted", color: "#3b82f6", probability: 20, kind: "OPEN" },
  { name: "Qualified", color: "#6366f1", probability: 35, kind: "OPEN" },
  { name: "Interested", color: "#f59e0b", probability: 50, kind: "OPEN" },
  { name: "Proposal", color: "#a855f7", probability: 65, kind: "OPEN" },
  { name: "Negotiation", color: "#ec4899", probability: 80, kind: "OPEN" },
  { name: "Won", color: "#10b981", probability: 100, kind: "WON" },
  { name: "Lost", color: "#ef4444", probability: 0, kind: "LOST" },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "org";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 422 }
      );
    }
    const { name, organizationName, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Unique org slug (append a short suffix on collision).
    let slug = slugify(organizationName);
    if (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // First user of an org becomes ADMIN. Bootstrap org + subscription + pipeline.
    await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: organizationName,
          slug,
          subscription: { create: { plan: "FREE", status: "TRIALING" } },
          pipelines: {
            create: {
              name: "Sales Pipeline",
              isDefault: true,
              stages: {
                create: DEFAULT_STAGES.map((s, i) => ({
                  name: s.name,
                  color: s.color,
                  order: i,
                  probability: s.probability,
                  kind: s.kind,
                })),
              },
            },
          },
        },
      });

      await tx.user.create({
        data: {
          organizationId: org.id,
          email,
          name,
          passwordHash,
          role: "ADMIN",
        },
      });
    });

    // Send the verification email (non-blocking — never fail signup over it).
    try { await requestVerification(email); } catch { /* swallow */ }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
