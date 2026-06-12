import { z } from "zod";
import { LEAD_STATUSES } from "@/lib/enums";

export const createLeadSchema = z.object({
  name: z.string().trim().min(1, "Business name is required."),
  contactPerson: z.string().trim().optional().default(""),
  email: z.string().trim().email().optional().or(z.literal("")).default(""),
  phone: z.string().trim().optional().default(""),
  website: z.string().trim().optional().default(""),
  address: z.string().trim().optional().default(""),
  category: z.string().trim().optional().default(""),
  industry: z.string().trim().optional().default(""),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  reviews: z.coerce.number().int().min(0).optional().nullable(),
  source: z.string().trim().optional().default("MANUAL"),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  assignedUserId: z.string().nullable().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().or(z.literal("")).optional(),
  phone: z.string().optional(),
  industry: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dealValue: z.coerce.number().min(0).nullable().optional(),
  expectedCloseDate: z.string().nullable().optional(),
});

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export const addNoteSchema = z.object({
  body: z.string().trim().min(1, "Note cannot be empty."),
});

export const logCallSchema = z.object({
  summary: z.string().trim().min(1, "Add a quick note about the call."),
  outcome: z.string().trim().optional(),
  reminderAt: z.string().nullable().optional(), // ISO datetime for the follow-up
  reminderTitle: z.string().trim().optional(),
});

export type LogCallInput = z.infer<typeof logCallSchema>;
