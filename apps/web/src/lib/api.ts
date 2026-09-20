import type { Todo, TodoDraft, TodoFilter } from "./types";

const workspaceKey = "daymark-workspace-id";

function getWorkspaceId() {
  let id = window.localStorage.getItem(workspaceKey);
  if (!id) {
    id = window.crypto.randomUUID();
    window.localStorage.setItem(workspaceKey, id);
  }
  return id;
}

function getApiUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:8787";
  }
  throw new Error("NEXT_PUBLIC_API_URL is not configured for this deployment.");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Workspace-ID": getWorkspaceId(),
      ...init?.headers,
    },
  });

  const body = (await response.json().catch(() => null)) as { error?: string } | T | null;
  if (!response.ok) {
    const message = body && typeof body === "object" && "error" in body ? body.error : undefined;
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return body as T;
}

export const todoApi = {
  list(filter: TodoFilter = "all", query = "") {
    const params = new URLSearchParams({ filter });
    if (query.trim()) params.set("query", query.trim());
    return request<{ todos: Todo[] }>(`/api/todos?${params}`);
  },
  create(draft: TodoDraft) {
    return request<{ todo: Todo }>("/api/todos", {
      method: "POST",
      body: JSON.stringify(draft),
    });
  },
  update(id: string, patch: Partial<TodoDraft> & { completed?: boolean }) {
    return request<{ todo: Todo }>(`/api/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },
  remove(id: string) {
    return request<{ deleted: true }>(`/api/todos/${id}`, { method: "DELETE" });
  },
  clearCompleted() {
    return request<{ deleted: number }>("/api/todos/completed", { method: "DELETE" });
  },
};
