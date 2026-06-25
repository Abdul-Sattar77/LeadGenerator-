import crypto from "crypto";

// Signed, tamper-proof unsubscribe links (no DB token storage needed).
function secret(): string {
  return process.env.AUTH_SECRET || "dev-secret-change-me";
}

export function unsubToken(contactId: string): string {
  return crypto.createHmac("sha256", secret()).update(`unsub:${contactId}`).digest("hex").slice(0, 32);
}

export function verifyUnsub(contactId: string, token: string): boolean {
  const expected = unsubToken(contactId);
  if (!token || token.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function unsubscribeUrl(contactId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/unsubscribe?cid=${contactId}&t=${unsubToken(contactId)}`;
}

/** Compliance footer appended to every outbound email (CAN-SPAM / GDPR). */
export function unsubscribeFooterHtml(contactId: string): string {
  const url = unsubscribeUrl(contactId);
  return (
    `<div style="margin-top:28px;padding-top:14px;border-top:1px solid #eaeaea;color:#9aa0a6;font-size:12px;line-height:1.5">` +
    `You're receiving this because you're a contact in our CRM. ` +
    `<a href="${url}" style="color:#9aa0a6;text-decoration:underline">Unsubscribe</a>.` +
    `</div>`
  );
}
