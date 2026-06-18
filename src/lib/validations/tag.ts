import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string().trim().min(1, "Tag name is required.").max(40),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color.").optional(),
});

// Attach: either an existing tagId, or a new tag by name (created on the fly).
export const attachTagSchema = z.object({
  tagId: z.string().min(1).optional(),
  name: z.string().trim().max(40).optional(),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional(),
}).refine((v) => v.tagId || v.name, { message: "Provide a tag or a name." });

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type AttachTagInput = z.infer<typeof attachTagSchema>;
