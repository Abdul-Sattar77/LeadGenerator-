import { Resend } from "resend";
import nodemailer, { type Transporter } from "nodemailer";

// Email sending with graceful fallback. Order of preference:
//   1. Resend  (RESEND_API_KEY)        — transactional API
//   2. SMTP    (SMTP_HOST/USER/PASS)   — free: send via your own Gmail/Outlook
//   3. Simulated                       — no provider; flow still works in demo
// Templates, history and open/click tracking work in all three modes.

let resend: Resend | null = null;
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

let smtp: Transporter | null = null;
function getSmtp(): Transporter | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  if (!smtp) {
    const port = Number(SMTP_PORT) || 587;
    smtp = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return smtp;
}

export function isEmailLive(): boolean {
  return Boolean(process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS));
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
  const sender = from || process.env.EMAIL_FROM || process.env.SMTP_USER || "LeadFinder <onboarding@resend.dev>";

  // 1) Resend
  const client = getResend();
  if (client) {
    try {
      const { error } = await client.emails.send({ from: sender, to, subject, html });
      if (error) return { delivered: false, error: error.message };
      return { delivered: true };
    } catch (e) {
      return { delivered: false, error: e instanceof Error ? e.message : "Send failed" };
    }
  }

  // 2) SMTP (e.g. free via Gmail app password)
  const transport = getSmtp();
  if (transport) {
    try {
      await transport.sendMail({ from: sender, to, subject, html });
      return { delivered: true };
    } catch (e) {
      return { delivered: false, error: e instanceof Error ? e.message : "SMTP send failed" };
    }
  }

  // 3) No provider — simulate.
  return { delivered: false };
}
