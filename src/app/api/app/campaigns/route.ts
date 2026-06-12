import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import { listCampaigns, createCampaign } from "@/server/services/campaignService";
import { createCampaignSchema } from "@/lib/validations/campaign";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, "MANAGER")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ campaigns: await listCampaigns(ctx) });
}

export async function POST(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, "MANAGER")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = createCampaignSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 422 });
  return NextResponse.json({ campaign: await createCampaign(ctx, parsed.data) }, { status: 201 });
}
