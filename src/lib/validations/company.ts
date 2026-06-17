import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .max(200)
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : undefined));

const optionalText = (max = 200) =>
  z.string().trim().max(max).optional().or(z.literal("")).transform((v) => (v ? v : undefined));

export const createCompanySchema = z.object({
  name: z.string().trim().min(1, "Company name is required.").max(160),
  domain: optionalText(120),
  website: optionalUrl,
  phone: optionalText(40),
  industry: optionalText(80),
  size: optionalText(40),
  address: optionalText(240),
  city: optionalText(80),
  country: optionalText(80),
  ownerId: optionalText(40),
});

export const updateCompanySchema = createCompanySchema.partial();

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
