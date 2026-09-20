export type Priority = "none" | "low" | "medium" | "high";

export type Todo = {
  id: string;
  title: string;
  notes: string;
  completed: boolean;
  priority: Priority;
  dueDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type TodoDraft = {
  title: string;
  notes: string;
  priority: Priority;
  dueDate: string | null;
};

export type TodoFilter = "all" | "active" | "completed";
