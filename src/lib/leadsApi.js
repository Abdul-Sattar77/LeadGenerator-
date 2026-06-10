// Client-side wrappers around the /api/leads routes.
// Components call these instead of touching localStorage directly.
import { leadKey } from "@/lib/crm";

export { leadKey };

export async function fetchLeads() {
  const res = await fetch("/api/leads", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load leads");
  const data = await res.json();
  return data.leads || [];
}

export async function saveLead(lead) {
  const res = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
  });
  if (!res.ok) throw new Error("Failed to save lead");
  return (await res.json()).lead;
}

export async function deleteLead(key) {
  const res = await fetch(`/api/leads?key=${encodeURIComponent(key)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to remove lead");
  return true;
}

// Update CRM fields. patch = { stage?, notes?, tags?, followUpDate? }
export async function updateLead(key, patch) {
  const res = await fetch(`/api/leads?key=${encodeURIComponent(key)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update lead");
  return (await res.json()).lead;
}

// One-time import of any leads previously saved in localStorage, so existing
// users don't lose their saved list when we move to the database.
const MIGRATION_FLAG = "lf_migrated_to_db_v1";
const OLD_SAVED_KEY = "lf_saved_leads";

export async function migrateLocalLeadsOnce() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(MIGRATION_FLAG)) return;

  let old = [];
  try {
    old = JSON.parse(window.localStorage.getItem(OLD_SAVED_KEY) || "[]");
  } catch {
    old = [];
  }

  try {
    for (const lead of old) {
      await saveLead(lead); // upsert; stage defaults to "New" server-side
    }
    // Mark done regardless, so we never re-run (DB is now the source of truth).
    window.localStorage.setItem(MIGRATION_FLAG, new Date().toISOString());
  } catch {
    // If the server isn't reachable, leave the flag unset to retry next load.
  }
}
