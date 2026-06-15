import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantContext } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import { getCustomFieldDefs, setCustomFieldDefs } from "@/server/services/customFieldService";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ defs: await getCustomFieldDefs(ctx) });
}

const schema = z.object({
  defs: z.array(z.object({ key: z.string().optional(), label: z.string().trim().min(1) })).max(20),
});

export async function PUT(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, "ADMIN")) return NextResponse.json({ error: "Only admins can edit custom fields." }, { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  return NextResponse.json({ defs: await setCustomFieldDefs(ctx, parsed.data.defs) });
}
