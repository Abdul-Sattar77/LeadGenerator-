import { z } from "zod";

const optionalText = (max = 160) =>
  z.string().trim().max(max).optional().or(z.literal("")).transform((v) => (v ? v : undefined));

export const createDealSchema = z.object({
  name: z.string().trim().min(1, "Deal name is required.").max(160),
  value: z.coerce.number().min(0).max(1_000_000_000).optional(),
  pipelineId: z.string().min(1, "Pipeline is required."),
  stageId: optionalText(40),
  companyId: optionalText(40),
  primaryContactId: optionalText(40),
  ownerId: optionalText(40),
  expectedCloseDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? new Date(v) : undefined)),
});

export const updateDealSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  value: z.coerce.number().min(0).max(1_000_000_000).nullable().optional(),
  stageId: optionalText(40),
  companyId: optionalText(40),
  primaryContactId: optionalText(40),
  ownerId: optionalText(40),
  lostReason: optionalText(240),
  expectedCloseDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? new Date(v) : undefined)),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
