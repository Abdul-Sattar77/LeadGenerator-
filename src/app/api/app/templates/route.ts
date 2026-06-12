import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { listTemplates } from "@/server/services/emailService";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ templates: await listTemplates(ctx) });
}
