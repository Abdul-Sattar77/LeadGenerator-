import { z } from "zod";

export const savePipelineStagesSchema = z.object({
  stages: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().trim().min(1, "Stage name is required.").max(40),
        probability: z.coerce.number().int().min(0).max(100),
        kind: z.enum(["OPEN", "WON", "LOST"]),
        color: z.string().optional(),
      })
    )
    .min(1, "Add at least one stage.")
    .max(20),
});
