import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantContext } from "@/server/tenant";
import { isAiEnabled } from "@/lib/ai";
import { runLeadAi } from "@/server/services/aiService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  action: z.enum(["summarize", "next-step", "email"]),
  leadId: z.coerce.number().int(),
});

export async function POST(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAiEnabled()) {
    return NextResponse.json({ error: "AI isn’t configured. Add ANTHROPIC_API_KEY to your .env." }, { status: 400 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 422 });

  try {
    const result = await runLeadAi(ctx, parsed.data.action, parsed.data.leadId);
    if ("error" in result) return NextResponse.json(result, { status: 422 });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "AI request failed." }, { status: 500 });
  }
}
