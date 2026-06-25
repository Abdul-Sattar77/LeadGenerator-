import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { isOrgMember } from "@/server/orgGuards";
import { roleAtLeast } from "@/lib/enums";
import { listTasks, createTask } from "@/server/services/taskService";
import { createTaskSchema } from "@/lib/validations/task";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tasks = await listTasks(ctx, { view: searchParams.get("view") || undefined });
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, "SALES_REP")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = createTaskSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 422 }
    );
  }
  // Don't allow assigning to a user outside the caller's org.
  if (!(await isOrgMember(ctx, parsed.data.assignedUserId))) {
    return NextResponse.json({ error: "Invalid assignee." }, { status: 422 });
  }
  const task = await createTask(ctx, parsed.data);
  return NextResponse.json({ task }, { status: 201 });
}
