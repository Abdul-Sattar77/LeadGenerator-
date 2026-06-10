import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantContext } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import { updateOrgName } from "@/server/services/billingService";

export const dynamic = "force-dynamic";

const schema = z.object({ name: z.string().trim().min(2, "Name is too short.") });

// PATCH /api/app/org { name } — rename the workspace (Admin only).
export async function PATCH(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, "ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 });

  await updateOrgName(ctx, parsed.data.name);
  return NextResponse.json({ ok: true });
}
