import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import { updateMemberRole, removeMember } from "@/server/services/teamService";
import { updateRoleSchema } from "@/lib/validations/team";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, "ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = updateRoleSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid role." }, { status: 422 });

  const ok = await updateMemberRole(ctx, params.id, parsed.data.role);
  if (!ok) return NextResponse.json({ error: "Could not update (you can't change your own role)." }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, "ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ok = await removeMember(ctx, params.id);
  if (!ok) return NextResponse.json({ error: "Could not remove (you can't remove yourself)." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
