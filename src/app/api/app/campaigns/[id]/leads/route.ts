import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import { addContactsToCampaign, removeContactFromCampaign } from "@/server/services/campaignService";
import { addContactsSchema } from "@/lib/validations/campaign";

export const dynamic = "force-dynamic";

// POST -> add contacts to the campaign
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, "MANAGER")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = addContactsSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 422 });
  const added = await addContactsToCampaign(ctx, params.id, parsed.data.contactIds);
  return NextResponse.json({ added });
}

// DELETE ?contactId=... -> remove one contact from the campaign
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, "MANAGER")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const contactId = new URL(request.url).searchParams.get("contactId") || "";
  if (!contactId) return NextResponse.json({ error: "Invalid contactId" }, { status: 400 });
  const ok = await removeContactFromCampaign(ctx, params.id, contactId);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
