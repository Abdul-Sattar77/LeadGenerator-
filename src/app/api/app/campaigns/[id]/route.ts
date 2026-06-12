import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import { updateCampaign, deleteCampaign } from "@/server/services/campaignService";
import { updateCampaignSchema } from "@/lib/validations/campaign";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, "MANAGER")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = updateCampaignSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  const ok = await updateCampaign(ctx, params.id, parsed.data);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, "MANAGER")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ok = await deleteCampaign(ctx, params.id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
