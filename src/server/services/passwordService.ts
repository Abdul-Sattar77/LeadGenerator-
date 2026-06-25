import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/db";
import { sendEmail, appUrl } from "@/lib/email";

const RESET_PREFIX = "reset:";
const TTL_MS = 60 * 60 * 1000; // 1 hour

/** Always resolves (don't reveal whether an email exists). Emails a reset link if it does. */
export async function requestPasswordReset(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized }, select: { id: true, name: true } });
  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");
  const identifier = `${RESET_PREFIX}${normalized}`;
  // Clear any prior reset tokens for this email, then store the new one.
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({ data: { identifier, token, expires: new Date(Date.now() + TTL_MS) } });

  const link = `${appUrl()}/reset-password?email=${encodeURIComponent(normalized)}&token=${token}`;
  await sendEmail({
    to: normalized,
    subject: "Reset your LeadFinder password",
    html:
      `<p>Hi ${user.name || "there"},</p>` +
      `<p>We received a request to reset your password. This link expires in 1 hour:</p>` +
      `<p><a href="${link}">Reset my password</a></p>` +
      `<p>If you didn't request this, you can safely ignore this email.</p>`,
  });
}

export async function resetPassword(email: string, token: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const normalized = email.trim().toLowerCase();
  const identifier = `${RESET_PREFIX}${normalized}`;
  const row = await prisma.verificationToken.findFirst({ where: { identifier, token } });
  if (!row) return { ok: false, error: "Invalid or already-used reset link." };
  if (row.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    return { ok: false, error: "This reset link has expired. Request a new one." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { email: normalized }, data: { passwordHash } });
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  return { ok: true };
}
