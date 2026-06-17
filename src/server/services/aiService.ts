import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { generate } from "@/lib/ai";

async function contactContext(ctx: TenantContext, contactId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, organizationId: ctx.organizationId },
    select: {
      firstName: true, lastName: true, email: true, phone: true, title: true,
      lifecycleStage: true, leadScore: true,
      company: { select: { name: true, industry: true, website: true } },
    },
  });
  if (!contact) return null;
  const notes = await prisma.note.findMany({
    where: { contactId, organizationId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { body: true },
  });
  return { contact, notes: notes.map((n) => n.body) };
}

function describe(
  c: NonNullable<Awaited<ReturnType<typeof contactContext>>>["contact"],
  notes: string[]
): string {
  return [
    `Contact: ${`${c.firstName} ${c.lastName}`.trim()}`,
    `Title: ${c.title || "—"}`,
    `Company: ${c.company?.name || "—"}`,
    `Industry: ${c.company?.industry || "—"}`,
    `Website: ${c.company?.website || "none (opportunity!)"}`,
    `Email: ${c.email || "unknown"}`,
    `Lifecycle: ${c.lifecycleStage}`,
    `Lead score: ${c.leadScore}/100`,
    `Recent notes:`,
    notes.length ? notes.map((n) => `- ${n}`).join("\n") : "(none yet)",
  ].join("\n");
}

export type AiAction = "summarize" | "next-step" | "email";

export async function runContactAi(
  ctx: TenantContext,
  action: AiAction,
  contactId: string
): Promise<{ text: string } | { subject: string; body: string } | { error: string }> {
  const c = await contactContext(ctx, contactId);
  if (!c) return { error: "Contact not found." };
  const context = describe(c.contact, c.notes);

  if (action === "summarize") {
    const text = await generate({
      system: "You are a concise B2B sales assistant. No preamble.",
      prompt: `Summarise this contact in 3–4 short bullet points a salesperson can scan before reaching out. Be specific and practical.\n\n${context}`,
      maxTokens: 350,
    });
    return { text };
  }

  if (action === "next-step") {
    const text = await generate({
      system: "You are a sharp B2B sales coach. No preamble.",
      prompt: `Given this contact, recommend the single best next action and one short reason. 2–3 sentences max.\n\n${context}`,
      maxTokens: 250,
    });
    return { text };
  }

  // email
  const raw = await generate({
    system: "You are an expert B2B sales copywriter. Reply with STRICT JSON only, no markdown.",
    prompt:
      `Write a short, friendly cold outreach email for this contact. Under 120 words, personalised, with one clear soft call-to-action. ` +
      `Use {{contact}} for the contact's name and {{name}} for the company. ` +
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
