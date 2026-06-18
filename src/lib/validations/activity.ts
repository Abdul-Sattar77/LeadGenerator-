import { z } from "zod";

export const LOG_ACTIVITY_TYPES = ["CALL", "MEETING", "EMAIL"] as const;

export const logActivitySchema = z.object({
  type: z.enum(LOG_ACTIVITY_TYPES),
  outcome: z.string().trim().max(80).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  note: z.string().trim().max(5000).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  followUpInDays: z.coerce.number().int().min(0).max(365).optional(),
  followUpTitle: z.string().trim().max(200).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
});

export type LogActivityInput = z.infer<typeof logActivitySchema>;
