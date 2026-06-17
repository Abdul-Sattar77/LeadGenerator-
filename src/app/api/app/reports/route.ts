import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import { companiesCsv, teamCsv } from "@/server/services/reportsService";

export const dynamic = "force-dynamic";

// GET /api/app/reports?type=leads|team&format=csv  -> CSV download
export async function GET(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, "MANAGER")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const type = new URL(request.url).searchParams.get("type") || "companies";
  const csv = type === "team" ? await teamCsv(ctx) : await companiesCsv(ctx);
  const filename = `${type}-report.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
