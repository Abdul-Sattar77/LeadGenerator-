import { Resend } from "resend";

// Email sending with graceful fallback: when RESEND_API_KEY is unset, sends are
// "simulated" (not delivered) so the full flow — templates, history, open/click
// tracking — still works in dev/demo without an account.

let resend: Resend | null = null;
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

export function isEmailLive(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/** Fill {{name}}-style placeholders from a values map. */
export function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => vars[k] ?? "");
}

/** Rewrite http(s) links to go through our click-tracking redirect. */
export function rewriteLinksForTracking(html: string, trackingId: string): string {
  return html.replace(/href="(https?:\/\/[^"]+)"/g, (_m, url: string) => {
    const tracked = `${appUrl()}/api/track/click/${trackingId}?u=${encodeURIComponent(url)}`;
    return `href="${tracked}"`;
  });
}

/** Invisible 1x1 open-tracking pixel appended to the email body. */
export function trackingPixel(trackingId: string): string {
  return `<img src="${appUrl()}/api/track/open/${trackingId}" width="1" height="1" style="display:none" alt="" />`;
}

export interface SendArgs {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface SendResult {
  delivered: boolean; // true = sent via Resend, false = simulated
  error?: string;
}

export async function sendEmail({ to, subject, html, from }: SendArgs): Promise<SendResult> {
  const client = getResend();
  const sender = from || process.env.EMAIL_FROM || "LeadFinder <onboarding@resend.dev>";
  if (!client) {
    // No provider configured — simulate a successful send.
    return { delivered: false };
  }
  try {
    const { error } = await client.emails.send({ from: sender, to, subject, html });
    if (error) return { delivered: false, error: error.message };
    return { delivered: true };
  } catch (e) {
    return { delivered: false, error: e instanceof Error ? e.message : "Send failed" };
  }
}
