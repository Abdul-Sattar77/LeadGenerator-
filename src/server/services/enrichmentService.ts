import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { logActivity } from "@/server/services/recordService";

// ── Safe outward fetch (basic SSRF guard + timeout + size cap) ─────────────
function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  // Block obvious private / link-local / metadata literals.
  if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (h === "169.254.169.254") return true;
  return false;
}

async function safeFetch(url: string): Promise<string> {
  let u: URL;
  try { u = new URL(url); } catch { return ""; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return "";
  if (isBlockedHost(u.hostname)) return "";

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(u.toString(), {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadFinderBot/1.0)" },
    });
    if (!res.ok) return "";
    const buf = await res.arrayBuffer();
    return new TextDecoder().decode(buf.slice(0, 1_000_000)); // cap 1MB
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

// ── Extraction ─────────────────────────────────────────────────────────────
const JUNK_EMAIL = /(example\.|sentry|\.png|\.jpg|\.gif|\.webp|wixpress|@2x|placeholder|your-?email|domain\.com|email@)/i;
const GENERIC_LOCALS = new Set(["info", "sales", "contact", "hello", "admin", "support", "office", "team", "enquiries", "enquiry", "help"]);

function extractEmails(html: string, domain?: string): string[] {
  const found = new Set<string>();
  const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  for (const m of html.matchAll(re)) {
    const e = m[0].toLowerCase();
    if (JUNK_EMAIL.test(e)) continue;
    if (e.length > 100) continue;
    found.add(e);
  }
  const all = [...found];
  // Prefer emails on the company's own domain.
  if (domain) {
    const d = domain.replace(/^www\./, "");
    all.sort((a, b) => Number(b.endsWith(`@${d}`)) - Number(a.endsWith(`@${d}`)));
  }
  return all.slice(0, 10);
}

function extractPhones(html: string): string[] {
  const found = new Set<string>();
  for (const m of html.matchAll(/tel:([+0-9().\-\s]{6,20})/gi)) {
    found.add(m[1].trim());
  }
  return [...found].slice(0, 3);
}

function extractSocials(html: string): Record<string, string> {
  const socials: Record<string, string> = {};
  const patterns: [string, RegExp][] = [
    ["linkedin", /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:company|in)\/[A-Za-z0-9_\-./%]+/i],
    ["facebook", /https?:\/\/(?:www\.)?facebook\.com\/[A-Za-z0-9_\-./%]+/i],
    ["twitter", /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[A-Za-z0-9_]+/i],
    ["instagram", /https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9_.]+/i],
  ];
  for (const [key, re] of patterns) {
    const m = html.match(re);
    if (m) socials[key] = m[0];
  }
  return socials;
}

function humanizeLocalPart(local: string): { firstName: string; lastName: string } {
  if (GENERIC_LOCALS.has(local.toLowerCase())) {
    return { firstName: local.charAt(0).toUpperCase() + local.slice(1), lastName: "" };
  }
  const parts = local.split(/[._-]+/).filter(Boolean);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return { firstName: cap(parts[0] || local), lastName: parts[1] ? cap(parts[1]) : "" };
}

function siteRoot(website: string): string | null {
  try {
    const u = new URL(website.startsWith("http") ? website : `https://${website}`);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

/**
 * Enrich a company from its public website: scrape homepage + /contact + /about
 * for emails, phones and social links; auto-create contacts from new emails.
 * Free — uses only the company's own public site. No third-party data.
 */
export async function enrichCompany(ctx: TenantContext, companyId: string) {
  const company = await prisma.company.findFirst({
    where: { id: companyId, organizationId: ctx.organizationId },
    select: { id: true, name: true, website: true, phone: true, customData: true },
  });
  if (!company) throw new Error("Company not found.");
  if (!company.website) throw new Error("This company has no website to enrich from.");

  const root = siteRoot(company.website);
  if (!root) throw new Error("Invalid website URL.");
  const domain = new URL(root).host.replace(/^www\./, "");

  const pages = await Promise.all([safeFetch(root), safeFetch(`${root}/contact`), safeFetch(`${root}/about`)]);
  const html = pages.join("\n");
  if (!html) throw new Error("Couldn't reach the website (it may block bots or be offline).");

  const emails = extractEmails(html, domain);
  const phones = extractPhones(html);
  const socials = extractSocials(html);

  // Create contacts from emails not already in the org.
  let created = 0;
  for (const email of emails) {
    const exists = await prisma.contact.findFirst({
      where: { organizationId: ctx.organizationId, email },
      select: { id: true },
    });
    if (exists) continue;
    const { firstName, lastName } = humanizeLocalPart(email.split("@")[0]);
    await prisma.contact.create({
      data: {
        organizationId: ctx.organizationId,
        companyId: company.id,
        firstName,
        lastName,
        email,
        ownerId: ctx.userId,
        source: "ENRICHMENT",
      },
    });
    created++;
  }

  // Backfill company phone + store socials in customData.
  const data: Record<string, unknown> = {};
  if (!company.phone && phones[0]) data.phone = phones[0];
  if (Object.keys(socials).length) {
    let existing: Record<string, unknown> = {};
    try { existing = company.customData ? JSON.parse(company.customData) : {}; } catch { /* ignore */ }
    data.customData = JSON.stringify({ ...existing, socials });
  }
  if (Object.keys(data).length) await prisma.company.update({ where: { id: company.id }, data });

  await logActivity(ctx, "COMPANY_ENRICHED", { companyId: company.id }, {
    emails: emails.length, contactsCreated: created, phones: phones.length, socials: Object.keys(socials).length,
  });

  return {
    emailsFound: emails.length,
    contactsCreated: created,
    phone: phones[0] ?? null,
    socials,
  };
}
