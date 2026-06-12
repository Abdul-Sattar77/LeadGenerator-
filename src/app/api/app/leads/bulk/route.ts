import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantContext } from "@/server/tenant";
import { bulkLeads, type BulkAction } from "@/server/services/leadService";
import { LEAD_STATUSES } from "@/lib/enums";

export const dynamic = "force-dynamic";

const schema = z.object({
  ids: z.array(z.coerce.number().int()).min(1, "Select at least one lead."),
  action: z.discriminatedUnion("type", [
    z.object({ type: z.literal("status"), value: z.enum(LEAD_STATUSES) }),
    z.object({ type: z.literal("assign"), value: z.string().nullable() }),
    z.object({ type: z.literal("campaign"), value: z.string().nullable() }),
    z.object({ type: z.literal("delete") }),
  ]),
});

export async function POST(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 422 });
  }
  const result = await bulkLeads(ctx, parsed.data.ids, parsed.data.action as BulkAction);
  if ("error" in result) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, count: result.count });
}
