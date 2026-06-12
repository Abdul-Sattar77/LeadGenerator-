import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantContext } from "@/server/tenant";
import { importLeads } from "@/server/services/leadService";

export const dynamic = "force-dynamic";

const rowSchema = z.object({
  name: z.string().trim().min(1),
  contactPerson: z.string().trim().optional().default(""),
  email: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
  website: z.string().trim().optional().default(""),
  address: z.string().trim().optional().default(""),
  category: z.string().trim().optional().default(""),
  industry: z.string().trim().optional().default(""),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  reviews: z.coerce.number().int().min(0).optional().nullable(),
  source: z.string().optional().default("IMPORT"),
});

const schema = z.object({ rows: z.array(rowSchema).min(1, "No rows to import.").max(1000) });

export async function POST(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid file." }, { status: 422 });
  }
  const result = await importLeads(ctx, parsed.data.rows);
  return NextResponse.json({ ok: true, ...result });
}
