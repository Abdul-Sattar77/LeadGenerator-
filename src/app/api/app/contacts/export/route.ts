import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { contactsCsv } from "@/server/services/reportsService";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const csv = await contactsCsv(ctx);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contacts.csv"',
    },
  });
}
