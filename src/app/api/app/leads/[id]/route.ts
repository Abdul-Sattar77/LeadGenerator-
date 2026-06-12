import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { isOrgMember } from "@/server/orgGuards";
import { getLead, updateLead, deleteLead } from "@/server/services/leadService";
import { updateLeadSchema } from "@/lib/validations/lead";

export const dynamic = "force-dynamic";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) ? id : null;
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const data = await getLead(ctx, id);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const parsed = updateLeadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 422 }
    );
  }
  if (!(await isOrgMember(ctx, parsed.data.assignedUserId))) {
    return NextResponse.json({ error: "Invalid assignee." }, { status: 422 });
  }
  const lead = await updateLead(ctx, id, parsed.data);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const ok = await deleteLead(ctx, id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
