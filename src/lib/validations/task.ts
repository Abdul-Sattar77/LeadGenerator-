import { z } from "zod";
import { TASK_TYPES, TASK_STATUSES, TASK_PRIORITIES } from "@/lib/enums";

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  description: z.string().trim().optional().default(""),
  type: z.enum(TASK_TYPES).optional().default("CALL"),
  priority: z.enum(TASK_PRIORITIES).optional().default("MEDIUM"),
  dueDate: z.string().nullable().optional(),
  assignedUserId: z.string().nullable().optional(),
  leadId: z.coerce.number().int().nullable().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(TASK_TYPES).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: z.string().nullable().optional(),
  assignedUserId: z.string().nullable().optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// Task attached to a v2 record (company/contact/deal) — record link comes from the URL.
export const createRecordTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200),
  type: z.enum(TASK_TYPES).optional().default("CALL"),
  priority: z.enum(TASK_PRIORITIES).optional().default("MEDIUM"),
  dueDate: z.string().nullable().optional(),
  assignedUserId: z.string().nullable().optional(),
});

export type CreateRecordTaskInput = z.infer<typeof createRecordTaskSchema>;
