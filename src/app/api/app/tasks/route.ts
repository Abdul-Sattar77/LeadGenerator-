import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { listTasks, createTask } from "@/server/services/taskService";
import { createTaskSchema } from "@/lib/validations/task";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const leadIdParam = searchParams.get("leadId");
  const tasks = await listTasks(ctx, {
    view: searchParams.get("view") || undefined,
    leadId: leadIdParam ? Number(leadIdParam) : undefined,
  });
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createTaskSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 422 }
    );
  }
  const task = await createTask(ctx, parsed.data);
  return NextResponse.json({ task }, { status: 201 });
}
