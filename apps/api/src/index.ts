import { and, asc, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { todos } from "./db/schema";
import { createTodoSchema, updateTodoSchema, workspaceIdSchema } from "./domain/todo";
import { isAllowedOrigin } from "./lib/origin";

type Bindings = {
  DB: D1Database;
  CORS_ORIGINS?: string;
  ENVIRONMENT?: string;
};

type Variables = {
  workspaceId: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: (origin, context) => (isAllowedOrigin(origin, context.env.CORS_ORIGINS) ? origin : ""),
    allowHeaders: ["Content-Type", "X-Workspace-ID"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    maxAge: 86400,
  }),
);

app.use("/api/*", async (context, next) => {
  const parsed = workspaceIdSchema.safeParse(context.req.header("X-Workspace-ID"));
  if (!parsed.success) {
    return context.json({ error: "A valid X-Workspace-ID header is required." }, 400);
  }
  context.set("workspaceId", parsed.data);
  await next();
});

app.get("/", (context) =>
  context.json({
    name: "Daymark API",
    status: "ok",
    environment: context.env.ENVIRONMENT ?? "unknown",
  }),
);

app.get("/health", (context) => context.json({ status: "ok" }));

app.get("/api/todos", async (context) => {
  const workspaceId = context.get("workspaceId");
  const filter = context.req.query("filter") ?? "all";
  const query = context.req.query("query")?.trim().slice(0, 100);
  const conditions = [eq(todos.workspaceId, workspaceId)];

  if (filter === "active") conditions.push(eq(todos.completed, false));
  if (filter === "completed") conditions.push(eq(todos.completed, true));
  if (query) {
    const search = `%${query.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    const matches = or(like(todos.title, search), like(todos.notes, search));
    if (matches) conditions.push(matches);
  }

  const records = await drizzle(context.env.DB)
    .select()
    .from(todos)
    .where(and(...conditions))
    .orderBy(asc(todos.completed), desc(todos.position), desc(todos.createdAt));

  return context.json({ todos: records });
});

app.post("/api/todos", async (context) => {
  const input = await context.req.json().catch(() => null);
  const parsed = createTodoSchema.safeParse(input);
  if (!parsed.success) {
    return context.json({ error: parsed.error.issues[0]?.message ?? "Invalid task." }, 400);
  }

  const now = new Date().toISOString();
  const [record] = await drizzle(context.env.DB)
    .insert(todos)
    .values({
      id: crypto.randomUUID(),
      workspaceId: context.get("workspaceId"),
      ...parsed.data,
      position: Date.now(),
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return context.json({ todo: record }, 201);
});

app.delete("/api/todos/completed", async (context) => {
  const deleted = await drizzle(context.env.DB)
    .delete(todos)
    .where(and(eq(todos.workspaceId, context.get("workspaceId")), eq(todos.completed, true)))
    .returning({ id: todos.id });

  return context.json({ deleted: deleted.length });
});

app.patch("/api/todos/:id", async (context) => {
  const input = await context.req.json().catch(() => null);
  const parsed = updateTodoSchema.safeParse(input);
  if (!parsed.success) {
    return context.json({ error: parsed.error.issues[0]?.message ?? "Invalid update." }, 400);
  }

  const [record] = await drizzle(context.env.DB)
    .update(todos)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(and(eq(todos.id, context.req.param("id")), eq(todos.workspaceId, context.get("workspaceId"))))
    .returning();

  if (!record) return context.json({ error: "Task not found." }, 404);
  return context.json({ todo: record });
});

app.delete("/api/todos/:id", async (context) => {
  const deleted = await drizzle(context.env.DB)
    .delete(todos)
    .where(and(eq(todos.id, context.req.param("id")), eq(todos.workspaceId, context.get("workspaceId"))))
    .returning({ id: todos.id });

  if (!deleted.length) return context.json({ error: "Task not found." }, 404);
  return context.json({ deleted: true as const });
});

app.notFound((context) => context.json({ error: "Not found." }, 404));
app.onError((error, context) => {
  console.error(error);
  return context.json({ error: "An unexpected error occurred." }, 500);
});

export default app;
