import { NextResponse } from "next/server";
import { z } from "zod";
import { requestPasswordReset } from "@/server/services/passwordService";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().trim().email() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  // Always return ok — never reveal whether an account exists.
  if (parsed.success) {
    try { await requestPasswordReset(parsed.data.email); } catch { /* swallow */ }
  }
  return NextResponse.json({ ok: true });
}
