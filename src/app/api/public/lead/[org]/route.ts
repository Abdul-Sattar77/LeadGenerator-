import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getLeadLimit } from "@/server/services/billingService";
import { rateLimit, clientIp } from "@/server/rateLimit";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().max(120).optional().or(z.literal("")),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(60).optional().or(z.literal("")),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  website: z.string().optional(), // honeypot — real users leave this empty
});

export async function POST(request: Request, { params }: { params: { org: string } }) {
  // Spam protection: rate limit per IP.
  const rl = rateLimit(`leadform:${clientIp(request)}`, 5, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many submissions, please try again shortly." }, { status: 429 });

  const org = await prisma.organization.findUnique({ where: { id: params.org }, select: { id: true } });
  if (!org) return NextResponse.json({ error: "Form not found." }, { status: 404 });

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid submission." }, { status: 422 });
  const d = parsed.data;

  // Honeypot tripped → pretend success, create nothing.
  if (d.website) return NextResponse.json({ ok: true });
  if (!d.name && !d.email) return NextResponse.json({ error: "Please provide your name or email." }, { status: 422 });

  // Respect the org's plan company cap.
  const limit = await getLeadLimit(org.id);
  const atCap = limit != null && (await prisma.company.count({ where: { organizationId: org.id } })) >= limit;

  let companyId: string | undefined;
  const companyName = (d.company || "").trim();
  if (companyName && !atCap) {
    const found = await prisma.company.findFirst({ where: { organizationId: org.id, name: companyName }, select: { id: true } });
    const co = found ?? (await prisma.company.create({ data: { organizationId: org.id, name: companyName, source: "WEBSITE" } }));
    companyId = co.id;
  }

  const [firstName, ...rest] = (d.name || d.email || "Lead").trim().split(/\s+/);
  const contact = await prisma.contact.create({
    data: {
      organizationId: org.id,
      firstName: firstName || "Lead",
      lastName: rest.join(" "),
      email: d.email || null,
      phone: d.phone || null,
      companyId,
      source: "WEBSITE",
      lifecycleStage: "LEAD",
    },
  });

  if (d.message) {
    await prisma.note.create({ data: { organizationId: org.id, contactId: contact.id, body: `Web form message:\n${d.message}` } });
  }
  await prisma.activity.create({ data: { organizationId: org.id, contactId: contact.id, type: "FORM_SUBMITTED" } });

  return NextResponse.json({ ok: true });
}
