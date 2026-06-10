// Tiny localStorage helper used by the Dashboard (saved leads + search history).
// All guarded for SSR (window may be undefined on the server).

const SAVED_KEY = "lf_saved_leads";
const HISTORY_KEY = "lf_history";

function read(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

// Stable id for a lead (name + address) so we don't save duplicates.
export function leadId(lead) {
  return `${lead.name}|${lead.address}`.toLowerCase();
}

export function getSavedLeads() {
  return read(SAVED_KEY, []);
}

export function isSaved(lead) {
  const id = leadId(lead);
  return getSavedLeads().some((l) => leadId(l) === id);
}

export function toggleSaveLead(lead) {
  const id = leadId(lead);
  const current = getSavedLeads();
  const exists = current.some((l) => leadId(l) === id);
  const next = exists
    ? current.filter((l) => leadId(l) !== id)
    : [{ ...lead, savedAt: new Date().toISOString() }, ...current];
  write(SAVED_KEY, next);
  return !exists;
}

export function removeSavedLead(lead) {
  const id = leadId(lead);
  write(
    SAVED_KEY,
    getSavedLeads().filter((l) => leadId(l) !== id)
  );
}

export function getHistory() {
  return read(HISTORY_KEY, []);
}

export function addHistory(query, count) {
  const entry = { query, count, at: new Date().toISOString() };
  const next = [entry, ...getHistory().filter((h) => h.query !== query)].slice(0, 20);
  write(HISTORY_KEY, next);
}

export function clearHistory() {
  write(HISTORY_KEY, []);
}
