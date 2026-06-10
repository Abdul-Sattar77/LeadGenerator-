import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { listLeads, createLead } from "@/server/services/leadService";
import { createLeadSchema } from "@/lib/validations/lead";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const leads = await listLeads(ctx, {
    status: searchParams.get("status") || undefined,
    q: searchParams.get("q") || undefined,
    assignedUserId: searchParams.get("assignedUserId") || undefined,
  });
  return NextResponse.json({ leads });
}

export async function POST(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createLeadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 422 }
    );
  }
  const lead = await createLead(ctx, parsed.data);
  return NextResponse.json({ lead }, { status: 201 });
}
