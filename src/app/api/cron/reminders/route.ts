import { NextResponse } from "next/server";
import { runDueReminders } from "@/server/services/reminderService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Scheduler hits this every few minutes (e.g. Vercel Cron) to send due
// follow-up reminders. Guarded by CRON_SECRET when set (Authorization: Bearer,
// or ?secret=). In dev with no secret it's open for easy testing.
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = request.headers.get("authorization");
  const qp = new URL(request.url).searchParams.get("secret");
  return auth === `Bearer ${secret}` || qp === secret;
}

async function handle(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Forbidden" }, { status: 401 });
  const result = await runDueReminders();
  return NextResponse.json({ ok: true, ...result });
}

export const GET = handle;
export const POST = handle;
