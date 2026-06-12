import { prisma } from "@/server/db";
import { sendEmail, type SendResult } from "@/lib/email";
import { googleEnabled, refreshAccessToken, gmailSend } from "@/lib/googleMail";

/** The user's connected Gmail (if any). */
export async function getConnectedGmail(userId: string): Promise<{ email: string } | null> {
  const acct = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { email: true },
  });
  return acct?.email ? { email: acct.email } : null;
}

/** Send an outreach email "as" the user: via their connected Gmail if present,
 *  otherwise fall back to the system provider (Resend / SMTP / simulated). */
export async function sendForUser(
  userId: string,
  args: { to: string; subject: string; html: string }
): Promise<SendResult> {
  if (googleEnabled()) {
    const acct = await prisma.account.findFirst({ where: { userId, provider: "google" } });
    if (acct?.refreshToken && acct.email) {
      try {
        let accessToken = acct.accessToken ?? "";
        const now = Math.floor(Date.now() / 1000);
        if (!accessToken || !acct.expiresAt || acct.expiresAt <= now + 60) {
          const refreshed = await refreshAccessToken(acct.refreshToken);
          accessToken = refreshed.accessToken;
          await prisma.account.update({
            where: { id: acct.id },
            data: { accessToken, expiresAt: refreshed.expiresAt },
          });
        }
        await gmailSend(accessToken, { from: acct.email, to: args.to, subject: args.subject, html: args.html });
        return { delivered: true };
      } catch (e) {
        return { delivered: false, error: e instanceof Error ? e.message : "Gmail send failed" };
      }
    }
  }
  // Not connected — system mailer.
  return sendEmail(args);
}
