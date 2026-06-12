import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { sendEmail, renderTemplate, rewriteLinksForTracking, trackingPixel } from "@/lib/email";

// Seeded for every org on first use.
const DEFAULT_TEMPLATES = [
  {
    type: "INTRODUCTION",
    name: "Introduction",
    subject: "Quick idea for {{name}}",
    body:
      "Hi {{contact}},\n\nI came across {{name}} and had a quick idea that could help you get more customers. Would you be open to a short call this week?\n\nBest,\nThe LeadFinder team",
  },
  {
    type: "FOLLOW_UP",
    name: "Follow-up",
    subject: "Following up — {{name}}",
    body:
      "Hi {{contact}},\n\nJust following up on my note about {{name}}. Happy to share a few quick ideas whenever you have 10 minutes.\n\nThanks!",
  },
  {
    type: "PROPOSAL",
    name: "Proposal",
    subject: "Proposal for {{name}}",
    body:
      "Hi {{contact}},\n\nThanks for your time. As discussed, here's a short proposal for {{name}}. Let me know what you think and we can get started.\n\nBest regards",
  },
];

export async function listTemplates(ctx: TenantContext) {
  let rows = await prisma.emailTemplate.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: "asc" },
  });
  if (rows.length === 0) {
    await prisma.emailTemplate.createMany({
      data: DEFAULT_TEMPLATES.map((t) => ({ ...t, organizationId: ctx.organizationId })),
    });
    rows = await prisma.emailTemplate.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: "asc" },
    });
  }
  return rows.map((t) => ({ id: t.id, name: t.name, subject: t.subject, body: t.body, type: t.type }));
}

function textToHtml(text: string): string {
  // Minimal: escape + paragraph/line breaks.
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc.split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("\n");
}

export async function listLeadEmails(ctx: TenantContext, leadId: number) {
  const rows = await prisma.emailMessage.findMany({
    where: { organizationId: ctx.organizationId, leadId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(serializeEmail);
}

function serializeEmail(m: { id: string; toEmail: string; subject: string; status: string; openCount: number; clickCount: number; sentAt: Date | null; createdAt: Date }) {
  return {
    id: m.id,
    toEmail: m.toEmail,
    subject: m.subject,
    status: m.status,
    openCount: m.openCount,
    clickCount: m.clickCount,
    sentAt: (m.sentAt ?? m.createdAt).toISOString(),
  };
}

export async function sendToLead(
  ctx: TenantContext,
  input: { leadId: number; subject: string; body: string; templateId?: string | null; campaignId?: string | null }
): Promise<{ ok: true; delivered: boolean } | { ok: false; error: string }> {
  const lead = await prisma.lead.findFirst({
    where: { id: input.leadId, organizationId: ctx.organizationId },
    select: { id: true, name: true, email: true, contactPerson: true },
  });
  if (!lead) return { ok: false, error: "Lead not found." };
  if (!lead.email) return { ok: false, error: "This lead has no email address." };

  const vars = { name: lead.name, contact: lead.contactPerson || "there" };
  const subject = renderTemplate(input.subject, vars);
  const bodyText = renderTemplate(input.body, vars);

  // Create the row first so we have a trackingId to embed.
  const msg = await prisma.emailMessage.create({
    data: {
      organizationId: ctx.organizationId,
      leadId: lead.id,
      templateId: input.templateId ?? null,
      campaignId: input.campaignId ?? null,
      fromUserId: ctx.userId,
      toEmail: lead.email,
      subject,
      body: bodyText,
      status: "SENT",
    },
  });

  const html = rewriteLinksForTracking(textToHtml(bodyText), msg.trackingId) + trackingPixel(msg.trackingId);
  const result = await sendEmail({ to: lead.email, subject, html });

  const status = result.error ? "FAILED" : result.delivered ? "SENT" : "SIMULATED";
  await prisma.emailMessage.update({
    where: { id: msg.id },
    data: { status, sentAt: result.error ? null : new Date() },
  });

  if (!result.error) {
    await prisma.activity.create({
      data: { organizationId: ctx.organizationId, userId: ctx.userId, leadId: lead.id, type: "EMAIL_SENT", metadata: JSON.stringify({ subject }) },
    });
  }

  if (result.error) return { ok: false, error: result.error };
  return { ok: true, delivered: result.delivered };
}

/** Send a templated email to every lead in a campaign that has an email address. */
export async function sendCampaignEmails(
  ctx: TenantContext,
  campaignId: string,
  input: { subject: string; body: string; templateId?: string | null }
): Promise<{ sent: number; skipped: number }> {
  const leads = await prisma.lead.findMany({
    where: { organizationId: ctx.organizationId, campaignId },
    select: { id: true, email: true },
  });

  let sent = 0;
  let skipped = 0;
  for (const lead of leads) {
    if (!lead.email) { skipped++; continue; }
    const res = await sendToLead(ctx, { leadId: lead.id, subject: input.subject, body: input.body, templateId: input.templateId, campaignId });
    if (res.ok) sent++;
    else skipped++;
  }
  return { sent, skipped };
}

/** Aggregate email engagement for a campaign. */
export async function campaignEmailStats(ctx: TenantContext, campaignId: string) {
  const rows = await prisma.emailMessage.findMany({
    where: { organizationId: ctx.organizationId, campaignId },
    select: { status: true },
  });
  const sent = rows.length;
  const opened = rows.filter((r) => r.status === "OPENED" || r.status === "CLICKED").length;
  const clicked = rows.filter((r) => r.status === "CLICKED").length;
  return {
    sent,
    opened,
    clicked,
    openRate: sent ? Math.round((opened / sent) * 100) : 0,
    clickRate: sent ? Math.round((clicked / sent) * 100) : 0,
  };
}
