"use client";

import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Cloud,
  Edit3,
  Inbox,
  ListChecks,
  LoaderCircle,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { todoApi } from "@/lib/api";
import type { Priority, Todo, TodoDraft, TodoFilter } from "@/lib/types";
import { cn, formatDueDate, isOverdue } from "@/lib/utils";

const emptyDraft: TodoDraft = { title: "", notes: "", priority: "none", dueDate: null };

const priorityLabels: Record<Priority, string> = {
  none: "No priority",
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<TodoFilter>("all");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<TodoDraft>(emptyDraft);
  const [showDetails, setShowDetails] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);

  useEffect(() => {
    let active = true;
    todoApi
      .list()
      .then((result) => {
        if (active) setTodos(result.todos);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load your tasks.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const counts = useMemo(
    () => ({
      all: todos.length,
      active: todos.filter((todo) => !todo.completed).length,
      completed: todos.filter((todo) => todo.completed).length,
    }),
    [todos],
  );

  const visibleTodos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return todos.filter((todo) => {
      if (filter === "active" && todo.completed) return false;
      if (filter === "completed" && !todo.completed) return false;
      if (!normalizedQuery) return true;
      return `${todo.title} ${todo.notes}`.toLowerCase().includes(normalizedQuery);
    });
  }, [filter, query, todos]);

  const progress = counts.all ? Math.round((counts.completed / counts.all) * 100) : 0;

  async function createTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const result = await todoApi.create({ ...draft, title: draft.title.trim(), notes: draft.notes.trim() });
      setTodos((current) => [result.todo, ...current]);
      setDraft(emptyDraft);
      setShowDetails(false);
      setToast("Task added");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add that task.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleTodo(todo: Todo) {
    const nextValue = !todo.completed;
    setTodos((current) => current.map((item) => (item.id === todo.id ? { ...item, completed: nextValue } : item)));
    try {
      const result = await todoApi.update(todo.id, { completed: nextValue });
      setTodos((current) => current.map((item) => (item.id === todo.id ? result.todo : item)));
    } catch (cause) {
      setTodos((current) => current.map((item) => (item.id === todo.id ? todo : item)));
      setError(cause instanceof Error ? cause.message : "Could not update that task.");
    }
  }

  async function removeTodo(todo: Todo) {
    const snapshot = todos;
    setTodos((current) => current.filter((item) => item.id !== todo.id));
    try {
      await todoApi.remove(todo.id);
      setToast("Task deleted");
    } catch (cause) {
      setTodos(snapshot);
      setError(cause instanceof Error ? cause.message : "Could not delete that task.");
    }
  }

  async function updateTodo(id: string, patch: TodoDraft) {
    setSaving(true);
    try {
      const result = await todoApi.update(id, patch);
      setTodos((current) => current.map((todo) => (todo.id === id ? result.todo : todo)));
      setEditing(null);
      setToast("Changes saved");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your changes.");
    } finally {
      setSaving(false);
    }
  }

  async function clearCompleted() {
    const snapshot = todos;
    setTodos((current) => current.filter((todo) => !todo.completed));
    try {
      const result = await todoApi.clearCompleted();
      setToast(`${result.deleted} completed ${result.deleted === 1 ? "task" : "tasks"} cleared`);
    } catch (cause) {
      setTodos(snapshot);
      setError(cause instanceof Error ? cause.message : "Could not clear completed tasks.");
    }
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />

      <section className="workspace">
        <header className="site-header">
          <a className="brand" href="#top" aria-label="Daymark home">
            <span className="brand__mark"><Check size={17} strokeWidth={3} /></span>
            <span>daymark</span>
          </a>
          <div className="sync-badge"><Cloud size={14} /> Synced</div>
        </header>

        <div className="hero" id="top">
          <div>
            <p className="eyebrow"><Sparkles size={14} /> Your quiet corner for getting things done</p>
            <h1>Make space for<br /><em>what matters.</em></h1>
            <p className="hero__copy">Capture the noise, choose your focus, and enjoy the small satisfaction of crossing it off.</p>
          </div>
          <div className="progress-card" aria-label={`${progress}% of tasks completed`}>
            <div className="progress-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}>
              <div><strong>{progress}%</strong><span>complete</span></div>
            </div>
            <div>
              <span className="progress-card__label">Today&apos;s rhythm</span>
              <strong>{counts.active === 0 && counts.all > 0 ? "All clear" : `${counts.active} left to do`}</strong>
              <small suppressHydrationWarning>{new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</small>
            </div>
          </div>
        </div>

        <form className="composer" onSubmit={createTodo}>
          <div className="composer__main">
            <span className="composer__plus"><Plus size={20} /></span>
            <label className="sr-only" htmlFor="new-task">Add a task</label>
            <input
              id="new-task"
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="What would you like to get done?"
              maxLength={200}
              autoComplete="off"
            />
            <button className="details-toggle" type="button" onClick={() => setShowDetails((value) => !value)} aria-expanded={showDetails}>
              Details <ChevronDown size={15} className={cn(showDetails && "rotate-180")} />
            </button>
            <Button type="submit" disabled={!draft.title.trim() || saving}>
              {saving ? <LoaderCircle className="spin" size={17} /> : <Plus size={17} />} Add task
            </Button>
          </div>
          {showDetails && (
            <div className="composer__details">
              <label>Priority
                <select value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value as Priority }))}>
                  {Object.entries(priorityLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </label>
              <label>Due date
                <input type="date" value={draft.dueDate ?? ""} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value || null }))} />
              </label>
              <label className="notes-field">Notes
                <input value={draft.notes} maxLength={2000} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Anything worth remembering?" />
              </label>
            </div>
          )}
        </form>

        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} aria-label="Dismiss error"><X size={16} /></button>
          </div>
        )}

        <section className="task-panel" aria-label="Tasks">
          <div className="task-toolbar">
            <div className="filters" role="tablist" aria-label="Task filters">
              {(["all", "active", "completed"] as const).map((value) => (
                <button key={value} type="button" role="tab" aria-selected={filter === value} className={cn(filter === value && "is-active")} onClick={() => setFilter(value)}>
                  {value === "all" ? "All" : value === "active" ? "Open" : "Done"}
                  <span>{counts[value]}</span>
                </button>
              ))}
            </div>
            <label className="search-box">
              <Search size={16} />
              <span className="sr-only">Search tasks</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" />
              {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={14} /></button>}
            </label>
          </div>

          <div className="task-list">
            {loading ? (
              <LoadingList />
            ) : visibleTodos.length ? (
              visibleTodos.map((todo) => (
                <TodoRow key={todo.id} todo={todo} onToggle={() => void toggleTodo(todo)} onEdit={() => setEditing(todo)} onRemove={() => void removeTodo(todo)} />
              ))
            ) : (
              <EmptyState hasTasks={todos.length > 0} filter={filter} query={query} />
            )}
          </div>

          {!loading && counts.completed > 0 && (
            <div className="panel-footer">
              <span><CheckCircle2 size={15} /> {counts.completed} finished</span>
              <button type="button" onClick={() => void clearCompleted()}>Clear completed</button>
            </div>
          )}
        </section>

        <footer className="site-footer">
          <span><span className="status-dot" /> Cloudflare edge API</span>
          <span>Built for focused days.</span>
        </footer>
      </section>

      {editing && <TodoEditor todo={editing} saving={saving} onClose={() => setEditing(null)} onSave={updateTodo} />}
      {toast && <div className="toast" role="status"><CheckCircle2 size={17} /> {toast}</div>}
    </main>
  );
}

function TodoRow({ todo, onToggle, onEdit, onRemove }: { todo: Todo; onToggle: () => void; onEdit: () => void; onRemove: () => void }) {
  return (
    <article className={cn("todo-row", todo.completed && "is-completed")}>
      <button className="todo-check" type="button" onClick={onToggle} aria-label={todo.completed ? `Mark ${todo.title} as open` : `Mark ${todo.title} as done`}>
        {todo.completed ? <Check size={15} strokeWidth={3} /> : <Circle size={20} />}
      </button>
      <button className="todo-copy" type="button" onClick={onEdit}>
        <span className="todo-title">{todo.title}</span>
        {(todo.notes || todo.dueDate || todo.priority !== "none") && (
          <span className="todo-meta">
            {todo.priority !== "none" && <span className={`priority priority--${todo.priority}`}>{priorityLabels[todo.priority]}</span>}
            {todo.dueDate && <span className={cn(isOverdue(todo.dueDate) && !todo.completed && "is-overdue")}><CalendarDays size={13} /> {formatDueDate(todo.dueDate)}</span>}
            {todo.notes && <span className="todo-note">{todo.notes}</span>}
          </span>
        )}
      </button>
      <div className="row-actions">
        <button type="button" onClick={onEdit} aria-label={`Edit ${todo.title}`}><Edit3 size={16} /></button>
        <button type="button" onClick={onRemove} aria-label={`Delete ${todo.title}`}><Trash2 size={16} /></button>
      </div>
    </article>
  );
}

function TodoEditor({ todo, saving, onClose, onSave }: { todo: Todo; saving: boolean; onClose: () => void; onSave: (id: string, patch: TodoDraft) => Promise<void> }) {
  const [draft, setDraft] = useState<TodoDraft>({ title: todo.title, notes: todo.notes, priority: todo.priority, dueDate: todo.dueDate });

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="dialog" role="dialog" aria-modal="true" aria-labelledby="edit-title" onSubmit={(event) => { event.preventDefault(); void onSave(todo.id, { ...draft, title: draft.title.trim(), notes: draft.notes.trim() }); }}>
        <div className="dialog__header">
          <div><span>Edit task</span><h2 id="edit-title">Keep it clear and doable.</h2></div>
          <button type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        <label>Task
          <input autoFocus value={draft.title} maxLength={200} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
        </label>
        <label>Notes
          <textarea value={draft.notes} maxLength={2000} rows={4} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Add a little context…" />
        </label>
        <div className="dialog__grid">
          <label>Priority
            <select value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value as Priority }))}>
              {Object.entries(priorityLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </label>
          <label>Due date
            <input type="date" value={draft.dueDate ?? ""} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value || null }))} />
          </label>
        </div>
        <div className="dialog__actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!draft.title.trim() || saving}>{saving && <LoaderCircle className="spin" size={16} />} Save changes</Button>
        </div>
      </form>
    </div>
  );
}

function EmptyState({ hasTasks, filter, query }: { hasTasks: boolean; filter: TodoFilter; query: string }) {
  const isSearching = Boolean(query.trim());
  return (
    <div className="empty-state">
      <span>{isSearching ? <Search size={24} /> : filter === "completed" ? <ListChecks size={25} /> : hasTasks ? <CheckCircle2 size={25} /> : <Inbox size={25} />}</span>
      <h3>{isSearching ? "Nothing matches that search" : filter === "completed" ? "No completed tasks yet" : hasTasks ? "This view is all clear" : "A clear slate"}</h3>
      <p>{isSearching ? "Try a different word or clear the search." : "Add a task above when something comes to mind."}</p>
    </div>
  );
}

function LoadingList() {
  return (
    <div className="loading-list" aria-label="Loading tasks">
      {[72, 54, 64].map((width) => <div className="loading-row" key={width}><i /><span style={{ width: `${width}%` }} /></div>)}
    </div>
  );
}
