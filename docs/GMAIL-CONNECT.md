# Connect Gmail — one-time Google Cloud Console setup

This lets every user send outreach emails **from their own Gmail**. You (the
developer/owner) do this **once**; your customers just click **Connect Gmail**.

## What you'll end up with
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

…which go into `.env`.

---

## Step 1 — Create a Google Cloud project
1. Go to **https://console.cloud.google.com**
2. Top bar → project dropdown → **New Project** → name it `LeadFinder` → **Create**.
3. Make sure the new project is selected.

## Step 2 — Enable the Gmail API
1. Left menu → **APIs & Services → Library**.
2. Search **Gmail API** → click it → **Enable**.

## Step 3 — Configure the OAuth consent screen
1. **APIs & Services → OAuth consent screen**.
2. User type: **External** → **Create**.
3. App name: `LeadFinder`, user support email: your email, developer contact: your email → **Save and Continue**.
4. **Scopes** → **Add or remove scopes** → paste this scope and add it:
   ```
   https://www.googleapis.com/auth/gmail.send
   ```
   Save and Continue.
5. **Test users** → **Add users** → add the Gmail address(es) you'll test with
   (e.g. your own). → Save.
   - *(While the app is in “Testing”, only these test users can connect — that's
     fine for development. To open it to any customer you later submit the app
     for Google verification.)*

## Step 4 — Create the OAuth client credentials
1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type: **Web application**. Name: `LeadFinder Web`.
3. **Authorized redirect URIs → Add URI**, enter EXACTLY:
   - Local dev: `http://localhost:3001/api/google/callback`
   - Production: `https://YOUR-DOMAIN/api/google/callback`
   *(must match `NEXT_PUBLIC_APP_URL` + `/api/google/callback`)*
4. **Create** → a popup shows your **Client ID** and **Client secret**. Copy both.

## Step 5 — Put them in `.env`
```
GOOGLE_CLIENT_ID="xxxxxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxxxxxxx"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```
Restart the app (`npm run dev`).

## Step 6 — Connect
1. Sign in → **Settings → Email sending → Connect Gmail**.
2. Approve the Google permission.
3. Done — your outreach emails (lead emails + campaign blasts) now send **from
   your Gmail address**, and open/click tracking still works.

---

### Notes
- **Reminders/notifications** still go through the system mailer (Resend/SMTP) —
  those are "from the app", which is correct.
- Sending uses the `gmail.send` scope (send only — the app can't read your inbox).
- To send to *external* customers (not just test users), submit the app for
  **Google verification** (needs a privacy policy + homepage). Until then it
  works for accounts added under **Test users**.
- Microsoft/Outlook has the same model via Azure (Microsoft Graph) — can be
  added the same way later.
