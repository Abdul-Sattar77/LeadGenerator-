import crypto from "crypto";
import { prisma } from "@/server/db";
import { sendEmail, appUrl } from "@/lib/email";

const PREFIX = "verify:";
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

/** Send (or resend) an email-verification link. No-op if already verified. */
export async function requestVerification(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized }, select: { id: true, name: true, emailVerified: true } });
  if (!user || user.emailVerified) return;

  const token = crypto.randomBytes(32).toString("hex");
  const identifier = `${PREFIX}${normalized}`;
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({ data: { identifier, token, expires: new Date(Date.now() + TTL_MS) } });

  const link = `${appUrl()}/verify-email?email=${encodeURIComponent(normalized)}&token=${token}`;
  await sendEmail({
    to: normalized,
    subject: "Verify your LeadFinder email",
    html:
      `<p>Hi ${user.name || "there"},</p>` +
      `<p>Please confirm your email to finish setting up your account:</p>` +
      `<p><a href="${link}">Verify my email</a></p>` +
      `<p>This link expires in 24 hours.</p>`,
  });
}

export async function verifyEmail(email: string, token: string): Promise<{ ok: boolean; error?: string }> {
  const normalized = email.trim().toLowerCase();
  const identifier = `${PREFIX}${normalized}`;
  const row = await prisma.verificationToken.findFirst({ where: { identifier, token } });
  if (!row) return { ok: false, error: "Invalid or already-used verification link." };
  if (row.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    return { ok: false, error: "This link has expired — request a new one." };
  }
  await prisma.user.update({ where: { email: normalized }, data: { emailVerified: new Date() } });
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  return { ok: true };
}
