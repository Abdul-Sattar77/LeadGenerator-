// Central registry of TanStack Query keys for v2 modules.
// Keeps invalidation consistent and discoverable.
export const qk = {
  companies: (params?: unknown) => ["companies", params ?? {}] as const,
  company: (id: string) => ["company", id] as const,
  contacts: (params?: unknown) => ["contacts", params ?? {}] as const,
  contact: (id: string) => ["contact", id] as const,
  deals: (params?: unknown) => ["deals", params ?? {}] as const,
  deal: (id: string) => ["deal", id] as const,
};
