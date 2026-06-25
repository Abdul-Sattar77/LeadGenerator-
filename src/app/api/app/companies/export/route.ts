import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { companiesCsv } from "@/server/services/reportsService";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const csv = await companiesCsv(ctx);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="companies.csv"',
    },
  });
}
