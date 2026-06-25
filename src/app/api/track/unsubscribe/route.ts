import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { verifyUnsub } from "@/server/unsubscribe";

export const dynamic = "force-dynamic";

// Public, no-auth: one-click unsubscribe from a signed link in an email footer.
export async function POST(request: Request) {
  const { cid, t } = await request.json().catch(() => ({}));
  if (!cid || !t || !verifyUnsub(String(cid), String(t))) {
    return NextResponse.json({ error: "Invalid or expired unsubscribe link." }, { status: 400 });
  }
  await prisma.contact.updateMany({
    where: { id: String(cid) },
    data: { emailOptOut: true, emailOptOutAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
