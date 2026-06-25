import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmail } from "@/server/services/verifyService";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().trim().email(), token: z.string().min(10) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  const result = await verifyEmail(parsed.data.email, parsed.data.token);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
