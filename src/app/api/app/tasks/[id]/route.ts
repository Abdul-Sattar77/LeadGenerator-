import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { isOrgMember } from "@/server/orgGuards";
import { roleAtLeast } from "@/lib/enums";
import { updateTask, deleteTask } from "@/server/services/taskService";
import { updateTaskSchema } from "@/lib/validations/task";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, "SALES_REP")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = updateTaskSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 422 }
    );
  }
  if (!(await isOrgMember(ctx, parsed.data.assignedUserId))) {
    return NextResponse.json({ error: "Invalid assignee." }, { status: 422 });
  }
  const task = await updateTask(ctx, params.id, parsed.data);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ task });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, "SALES_REP")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ok = await deleteTask(ctx, params.id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
