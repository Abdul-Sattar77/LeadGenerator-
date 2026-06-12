import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

// 1x1 transparent GIF returned for every email-open. Public (no auth) — it's
// loaded by the recipient's mail client. `id` is the EmailMessage.trackingId.
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.emailMessage.updateMany({
      where: { trackingId: params.id },
      data: { openCount: { increment: 1 }, openedAt: new Date() },
    });
    // Don't downgrade a CLICKED message back to OPENED.
    await prisma.emailMessage.updateMany({
      where: { trackingId: params.id, status: { in: ["SENT", "SIMULATED"] } },
      data: { status: "OPENED" },
    });
  } catch {
    /* never block the pixel on a tracking error */
  }
  return new Response(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Content-Length": String(PIXEL.length),
    },
  });
}
