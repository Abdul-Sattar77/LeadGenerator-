import { z } from "zod";

// Shared between the register API route and the register form.
export const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  organizationName: z.string().trim().min(2, "Please enter a company / team name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password is too long."),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

export type LoginInput = z.infer<typeof loginSchema>;
