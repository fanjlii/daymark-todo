import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable(
  "todos",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    title: text("title").notNull(),
    notes: text("notes").notNull().default(""),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
    priority: text("priority", { enum: ["none", "low", "medium", "high"] }).notNull().default("none"),
    dueDate: text("due_date"),
    position: integer("position").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("todos_workspace_position_idx").on(table.workspaceId, table.position),
    index("todos_workspace_completed_idx").on(table.workspaceId, table.completed),
  ],
);

export type TodoRecord = typeof todos.$inferSelect;
