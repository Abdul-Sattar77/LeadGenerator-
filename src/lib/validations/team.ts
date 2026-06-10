import { z } from "zod";
import { ROLES } from "@/lib/enums";

export const addMemberSchema = z.object({
  name: z.string().trim().min(2, "Enter the member's name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  role: z.enum(ROLES).default("SALES_REP"),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const updateRoleSchema = z.object({
  role: z.enum(ROLES),
});
