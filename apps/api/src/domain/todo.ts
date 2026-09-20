import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const prioritySchema = z.enum(["none", "low", "medium", "high"]);

export const createTodoSchema = z.object({
  title: z.string().trim().min(1, "A title is required.").max(200),
  notes: z.string().trim().max(2000).optional().default(""),
  priority: prioritySchema.optional().default("none"),
  dueDate: z.union([z.string().regex(datePattern, "Use a YYYY-MM-DD due date."), z.null()]).optional().default(null),
});

export const updateTodoSchema = z
  .object({
    title: z.string().trim().min(1, "A title is required.").max(200).optional(),
    notes: z.string().trim().max(2000).optional(),
    completed: z.boolean().optional(),
    priority: prioritySchema.optional(),
    dueDate: z.union([z.string().regex(datePattern, "Use a YYYY-MM-DD due date."), z.null()]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");

export const workspaceIdSchema = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  "A valid workspace ID is required.",
);

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
