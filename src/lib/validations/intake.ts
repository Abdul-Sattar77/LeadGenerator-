import { z } from "zod";

const opt = (max = 200) =>
  z.string().trim().max(max).optional().or(z.literal("")).transform((v) => (v ? v : undefined));

// A business saved from Discover (Google Maps) into the relational CRM.
export const discoverSaveSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  category: opt(120),
  phone: opt(60),
  website: opt(200),
  address: opt(300),
  rating: z.coerce.number().min(0).max(5).nullable().optional(),
  reviews: z.coerce.number().int().min(0).nullable().optional(),
  source: opt(40),
});

export type DiscoverSaveInput = z.infer<typeof discoverSaveSchema>;
