import { z } from "zod";

export const createSequenceSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
});

export const updateSequenceSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  status: z.enum(["ACTIVE", "PAUSED"]).optional(),
});

export const saveStepsSchema = z.object({
  steps: z
    .array(
      z.object({
        dayOffset: z.coerce.number().int().min(0).max(365),
        subject: z.string().trim().min(1, "Subject required.").max(200),
        body: z.string().trim().min(1, "Body required.").max(5000),
      })
    )
    .max(20),
});

export const enrollSchema = z.object({
  contactIds: z.array(z.string().min(1)).min(1, "Select at least one contact.").max(500),
});

export type CreateSequenceInput = z.infer<typeof createSequenceSchema>;
