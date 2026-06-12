import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { generate } from "@/lib/ai";

async function leadContext(ctx: TenantContext, leadId: number) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, organizationId: ctx.organizationId },
    select: {
      name: true, category: true, industry: true, website: true, rating: true,
      reviews: true, address: true, contactPerson: true, email: true, status: true, leadScore: true,
    },
  });
  if (!lead) return null;
  const notes = await prisma.note.findMany({
    where: { leadId, organizationId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { body: true },
  });
  return { lead, notes: notes.map((n) => n.body) };
}

function describe(lead: NonNullable<Awaited<ReturnType<typeof leadContext>>>["lead"], notes: string[]): string {
  return [
    `Business: ${lead.name}`,
    `Category: ${lead.category || lead.industry || "—"}`,
    `Website: ${lead.website || "none (opportunity!)"}`,
    `Google rating: ${lead.rating ?? "—"} (${lead.reviews ?? 0} reviews)`,
    `Location: ${lead.address || "—"}`,
    `Contact: ${lead.contactPerson || "unknown"}`,
    `Pipeline status: ${lead.status}`,
    `Lead score: ${lead.leadScore}/100`,
    `Recent notes:`,
    notes.length ? notes.map((n) => `- ${n}`).join("\n") : "(none yet)",
  ].join("\n");
}

export type AiAction = "summarize" | "next-step" | "email";

export async function runLeadAi(
  ctx: TenantContext,
  action: AiAction,
  leadId: number
): Promise<{ text: string } | { subject: string; body: string } | { error: string }> {
  const c = await leadContext(ctx, leadId);
  if (!c) return { error: "Lead not found." };
  const context = describe(c.lead, c.notes);

  if (action === "summarize") {
    const text = await generate({
      system: "You are a concise B2B sales assistant. No preamble.",
      prompt: `Summarise this lead in 3–4 short bullet points a salesperson can scan before reaching out. Be specific and practical (call out angles like a missing website).\n\n${context}`,
      maxTokens: 350,
    });
    return { text };
  }

  if (action === "next-step") {
    const text = await generate({
      system: "You are a sharp B2B sales coach. No preamble.",
      prompt: `Given this lead, recommend the single best next action and one short reason. 2–3 sentences max.\n\n${context}`,
      maxTokens: 250,
    });
    return { text };
  }

  // email
  const raw = await generate({
    system: "You are an expert B2B sales copywriter. Reply with STRICT JSON only, no markdown.",
    prompt:
      `Write a short, friendly cold outreach email for this lead. Under 120 words, personalised, with one clear soft call-to-action. ` +
      `Use {{contact}} for the contact's name and {{name}} for the business. ` +
      `Reply ONLY as JSON: {"subject": "...", "body": "..."}.\n\n${context}`,
    maxTokens: 500,
  });
  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    if (parsed.subject && parsed.body) return { subject: String(parsed.subject), body: String(parsed.body) };
  } catch {
    /* fall through */
  }
  return { subject: `Quick idea for {{name}}`, body: raw };
}
