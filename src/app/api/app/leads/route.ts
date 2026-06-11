import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { listLeadsPaged, createLead } from "@/server/services/leadService";
import { createLeadSchema } from "@/lib/validations/lead";
import { PlanLimitError } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get("pageSize") || "10", 10) || 10));

  const { leads, total } = await listLeadsPaged(
    ctx,
    {
      status: searchParams.get("status") || undefined,
      q: searchParams.get("q") || undefined,
      assignedUserId: searchParams.get("assignedUserId") || undefined,
    },
    page,
    pageSize
  );
  return NextResponse.json({ leads, total, page, pageSize });
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
  try {
    const lead = await createLead(ctx, parsed.data);
    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    if (err instanceof PlanLimitError) {
      return NextResponse.json({ error: err.message, code: "PLAN_LIMIT" }, { status: 402 });
    }
    throw err;
  }
}
