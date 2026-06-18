import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantContext } from "@/server/tenant";
import { listViews, createView } from "@/server/services/savedViewService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const entity = new URL(request.url).searchParams.get("entity") || undefined;
  return NextResponse.json({ views: await listViews(ctx, entity) });
}

const schema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(40),
  filters: z
    .object({
      entity: z.string().optional(),
      q: z.string().optional(),
      tagId: z.string().optional(),
      lifecycleStage: z.string().optional(),
    })
    .default({}),
});

export async function POST(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 422 });
  return NextResponse.json({ view: await createView(ctx, parsed.data.name, parsed.data.filters) }, { status: 201 });
}
