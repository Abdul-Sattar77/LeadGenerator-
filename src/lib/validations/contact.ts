import { z } from "zod";

const optionalText = (max = 160) =>
  z.string().trim().max(max).optional().or(z.literal("")).transform((v) => (v ? v : undefined));

const LIFECYCLE = ["LEAD", "QUALIFIED", "CUSTOMER", "EVANGELIST"] as const;

export const createContactSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  lastName: z.string().trim().max(80).optional().or(z.literal("")).transform((v) => v ?? ""),
  email: z
    .string()
    .trim()
    .email("Enter a valid email.")
    .max(160)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  phone: optionalText(40),
  title: optionalText(120),
  companyId: optionalText(40),
  ownerId: optionalText(40),
  lifecycleStage: z.enum(LIFECYCLE).optional(),
});

export const updateContactSchema = createContactSchema.partial();

export const noteSchema = z.object({
  body: z.string().trim().min(1, "Note can't be empty.").max(5000),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
