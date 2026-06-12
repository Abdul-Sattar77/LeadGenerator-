import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantContext } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import { sendCampaignEmails } from "@/server/services/emailService";

export const dynamic = "force-dynamic";

const schema = z.object({
  subject: z.string().trim().min(1, "Subject is required."),
  body: z.string().trim().min(1, "Body is required."),
  templateId: z.string().nullable().optional(),
});

// POST /api/app/campaigns/:id/email -> blast a templated email to the campaign's leads
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, "MANAGER")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 422 });
  }
  const result = await sendCampaignEmails(ctx, params.id, parsed.data);
  return NextResponse.json({ ok: true, ...result });
}
