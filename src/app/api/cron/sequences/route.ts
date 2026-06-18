import { NextResponse } from "next/server";
import { runDueSequences } from "@/server/services/sequenceService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Scheduler hits this (e.g. daily) to send due sequence steps. Guarded by
// CRON_SECRET when set; open in dev for easy testing.
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = request.headers.get("authorization");
  const qp = new URL(request.url).searchParams.get("secret");
  return auth === `Bearer ${secret}` || qp === secret;
}

async function handle(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Forbidden" }, { status: 401 });
  const result = await runDueSequences();
  return NextResponse.json({ ok: true, ...result });
}

export const GET = handle;
export const POST = handle;
