import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { logCall } from "@/server/services/leadService";
import { logCallSchema } from "@/lib/validations/lead";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const parsed = logCallSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 422 });
  }
  const result = await logCall(ctx, id, parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json({ ok: true, reminderCreated: result.reminderCreated }, { status: 201 });
}
