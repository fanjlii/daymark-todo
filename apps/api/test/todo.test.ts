import { describe, expect, it } from "vitest";
import { createTodoSchema, updateTodoSchema, workspaceIdSchema } from "../src/domain/todo";
import { isAllowedOrigin } from "../src/lib/origin";

describe("todo input validation", () => {
  it("normalizes a valid task", () => {
    expect(createTodoSchema.parse({ title: "  Ship the app  " })).toEqual({
      title: "Ship the app",
      notes: "",
      priority: "none",
      dueDate: null,
    });
  });

  it("rejects blank titles and malformed dates", () => {
    expect(createTodoSchema.safeParse({ title: "   " }).success).toBe(false);
    expect(createTodoSchema.safeParse({ title: "Task", dueDate: "tomorrow" }).success).toBe(false);
  });

  it("rejects empty patches", () => {
    expect(updateTodoSchema.safeParse({}).success).toBe(false);
  });

  it("accepts browser-generated UUID v4 workspace IDs", () => {
    expect(workspaceIdSchema.safeParse("8db03698-38ff-4dc5-91ad-2d58472363f5").success).toBe(true);
    expect(workspaceIdSchema.safeParse("shared").success).toBe(false);
  });
});

describe("CORS origin policy", () => {
  it("allows local development and Vercel previews", () => {
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
    expect(isAllowedOrigin("https://daymark-git-feature-example.vercel.app")).toBe(true);
  });

  it("allows explicitly configured production origins only", () => {
    expect(isAllowedOrigin("https://todo.example.com", "https://todo.example.com")).toBe(true);
    expect(isAllowedOrigin("https://attacker.example", "https://todo.example.com")).toBe(false);
  });
});
