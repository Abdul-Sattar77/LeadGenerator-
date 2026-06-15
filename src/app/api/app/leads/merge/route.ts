import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantContext } from "@/server/tenant";
import { mergeLeads } from "@/server/services/leadService";

export const dynamic = "force-dynamic";

const schema = z.object({
  keepId: z.coerce.number().int(),
  mergeIds: z.array(z.coerce.number().int()).min(1, "Nothing to merge."),
});

export async function POST(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 422 });

  const result = await mergeLeads(ctx, parsed.data.keepId, parsed.data.mergeIds);
  if ("error" in result) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, merged: result.merged });
}
