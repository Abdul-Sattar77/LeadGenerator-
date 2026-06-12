import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import { addLeadsToCampaign, removeLeadFromCampaign } from "@/server/services/campaignService";
import { addLeadsSchema } from "@/lib/validations/campaign";

export const dynamic = "force-dynamic";

// POST -> add leads to the campaign
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, "MANAGER")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = addLeadsSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 422 });
  const added = await addLeadsToCampaign(ctx, params.id, parsed.data.leadIds);
  return NextResponse.json({ added });
}

// DELETE ?leadId=123 -> remove one lead from the campaign
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, "MANAGER")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const leadId = Number(new URL(request.url).searchParams.get("leadId"));
  if (!Number.isInteger(leadId)) return NextResponse.json({ error: "Invalid leadId" }, { status: 400 });
  const ok = await removeLeadFromCampaign(ctx, params.id, leadId);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
