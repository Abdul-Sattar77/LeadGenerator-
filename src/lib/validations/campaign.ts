import { z } from "zod";
import { CAMPAIGN_STATUSES } from "@/lib/enums";

export const createCampaignSchema = z.object({
  name: z.string().trim().min(2, "Campaign name is required."),
  description: z.string().trim().optional().default(""),
});

export const updateCampaignSchema = z.object({
  name: z.string().trim().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(CAMPAIGN_STATUSES).optional(),
});

export const addLeadsSchema = z.object({
  leadIds: z.array(z.coerce.number().int()).min(1, "Select at least one lead."),
});
