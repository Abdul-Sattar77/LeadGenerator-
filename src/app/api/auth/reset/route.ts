import { NextResponse } from "next/server";
import { z } from "zod";
import { resetPassword } from "@/server/services/passwordService";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().email(),
  token: z.string().min(10),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 422 });
  }
  const result = await resetPassword(parsed.data.email, parsed.data.token, parsed.data.password);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
