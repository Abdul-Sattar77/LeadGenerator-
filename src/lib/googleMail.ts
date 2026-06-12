// Google OAuth + Gmail API "send as the user" — implemented with plain fetch so
// there's no heavy SDK. Enabled only when GOOGLE_CLIENT_ID/SECRET are set.

const SCOPES = ["openid", "email", "https://www.googleapis.com/auth/gmail.send"].join(" ");
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export function googleEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
export function redirectUri(): string {
  return `${appUrl()}/api/google/callback`;
}

export function authUrl(state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline", // get a refresh_token
    prompt: "consent", // force refresh_token every time
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export async function exchangeCode(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt: number; email: string }> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  const tok = (await res.json()) as TokenResponse;

  const info = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tok.access_token}` },
  });
  const profile = (await info.json()) as { email?: string };

  return {
    accessToken: tok.access_token,
    refreshToken: tok.refresh_token,
    expiresAt: Math.floor(Date.now() / 1000) + (tok.expires_in ?? 3600),
    email: profile.email ?? "",
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number }> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${await res.text()}`);
  const tok = (await res.json()) as TokenResponse;
  return { accessToken: tok.access_token, expiresAt: Math.floor(Date.now() / 1000) + (tok.expires_in ?? 3600) };
}

function base64Url(input: string): string {
  return Buffer.from(input, "utf-8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Send an HTML email via the Gmail API as the connected user. */
export async function gmailSend(accessToken: string, args: { from: string; to: string; subject: string; html: string }): Promise<void> {
  const raw = base64Url(
    [
      `From: ${args.from}`,
      `To: ${args.to}`,
      `Subject: ${args.subject}`,
      "MIME-Version: 1.0",
      'Content-Type: text/html; charset="UTF-8"',
      "",
      args.html,
    ].join("\r\n")
  );

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) throw new Error(`Gmail send failed: ${await res.text()}`);
}
