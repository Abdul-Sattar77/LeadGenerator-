import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

// Records a click then redirects to the real URL (?u=...). Public — followed by
// the recipient. `id` is the EmailMessage.trackingId.
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const target = new URL(request.url).searchParams.get("u");

  try {
    await prisma.emailMessage.updateMany({
      where: { trackingId: params.id },
      data: { clickCount: { increment: 1 }, clickedAt: new Date(), status: "CLICKED" },
    });
  } catch {
    /* ignore tracking errors */
  }

  // Only redirect to safe absolute http(s) URLs.
  if (target && /^https?:\/\//i.test(target)) {
    return NextResponse.redirect(target, 302);
  }
  return NextResponse.json({ ok: true });
}
