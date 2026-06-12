// Central enum-like values. Stored as strings in the DB (portable across
// SQLite ↔ PostgreSQL) but type-safe at the app layer via these const unions.
// Reuse these everywhere instead of hard-coding string literals.

export const ROLES = ["ADMIN", "MANAGER", "SALES_REP", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

export const PLAN_TIERS = ["FREE", "PRO", "AGENCY"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const SUB_STATUSES = ["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED"] as const;
export type SubStatus = (typeof SUB_STATUSES)[number];

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "INTERESTED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const DEAL_STATUSES = ["OPEN", "WON", "LOST"] as const;
export type DealStatus = (typeof DEAL_STATUSES)[number];

export const TASK_TYPES = ["CALL", "MEETING", "EMAIL", "REMINDER"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const CAMPAIGN_STATUSES = ["DRAFT", "RUNNING", "COMPLETED"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

// Role hierarchy — higher number = more privilege. Used by requireRole().
export const ROLE_RANK: Record<Role, number> = {
  VIEWER: 0,
  SALES_REP: 1,
  MANAGER: 2,
  ADMIN: 3,
};

/** True if `role` is at least as privileged as `minimum`. */
export function roleAtLeast(role: string, minimum: Role): boolean {
  const r = ROLE_RANK[role as Role] ?? -1;
  return r >= ROLE_RANK[minimum];
}
