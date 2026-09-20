# Daymark

Daymark is a calm, full-stack todo application built as a small production monorepo. The frontend is a statically exported Next.js application on Vercel; the backend is a Cloudflare Worker with a D1 database and Drizzle ORM.

## Architecture

```text
Browser
  │
  ├── Vercel ───────── Next.js 16 + React 19 + TypeScript + Tailwind CSS
  │                         │
  │                         └── NEXT_PUBLIC_API_URL
  │
  └── Cloudflare Worker ─ Hono REST API + Zod validation
                            │
                            └── Drizzle ORM ─ Cloudflare D1
```

The reference stack recommends PostgreSQL. This deployment uses D1 deliberately so the backend and database are both native to Cloudflare and the project has only the two requested runtime platforms. The Drizzle data layer keeps a later move to PostgreSQL straightforward.

Each browser receives a random UUID stored in `localStorage`; the API uses it as an anonymous workspace boundary. This is appropriate for a demo or personal utility. Add a real identity provider before using the app for sensitive or shared data.

## Features

- Create, edit, complete, search, filter, delete, and bulk-clear tasks
- Notes, due dates, and four priority levels
- Optimistic completion and deletion with rollback on failure
- Anonymous per-browser workspaces
- Responsive, keyboard-accessible interface
- Runtime input validation and origin allow-listing
- D1 migrations, unit tests, linting, strict TypeScript, and production builds
- GitHub CI plus Vercel and Cloudflare Git-based preview/production deployments

## Local development

Requirements: Node.js 22+, pnpm 10+, and a current browser.

```bash
pnpm install
pnpm --filter @daymark/api db:migrate:local
pnpm dev
```

The frontend runs at `http://localhost:3000` and the Worker at `http://localhost:8787`. The web app falls back to that API URL locally, so no environment file is required for the default setup.

Useful commands:

```bash
pnpm check       # TypeScript and ESLint
pnpm test        # Unit tests
pnpm build       # Next.js export and Worker dry run
pnpm verify      # Complete verification pipeline
```

## Deployment

### 1. Cloudflare Worker and D1

1. Create a D1 database named `daymark-db`.
2. Replace the placeholder `database_id` in `apps/api/wrangler.jsonc` with the created database ID.
3. From the repository root, run `pnpm --filter @daymark/api deploy` once. This applies pending migrations before publishing the Worker.
4. In Cloudflare Workers & Pages, connect this GitHub repository to the Worker.
5. Use `main` as the production branch and set the deploy command to `pnpm --filter @daymark/api deploy`.

Cloudflare Workers Builds will then create preview versions for branches and deploy `main` automatically. See the [Cloudflare Git integration guide](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/).

### 2. Vercel frontend

1. Import the same GitHub repository into Vercel.
2. Set the project root directory to `apps/web`.
3. Add `NEXT_PUBLIC_API_URL` with the deployed Worker URL and enable it for Production, Preview, and Development.
4. Deploy.

Vercel will create preview deployments for branches and production deployments from `main`. See the [Vercel Git deployment guide](https://vercel.com/docs/git).

### 3. Optional custom domain

If a domain is managed by Cloudflare DNS, point the site hostname to Vercel following Vercel's domain instructions. Add that exact frontend origin to the Worker's `CORS_ORIGINS` variable as a comma-separated URL. Vercel preview URLs and local development origins are accepted automatically.

## API

All `/api/*` routes require an `X-Workspace-ID` UUID v4 header.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Liveness check |
| `GET` | `/api/todos` | List tasks |
| `POST` | `/api/todos` | Create a task |
| `PATCH` | `/api/todos/:id` | Update a task |
| `DELETE` | `/api/todos/:id` | Delete a task |
| `DELETE` | `/api/todos/completed` | Clear completed tasks |

## Repository layout

```text
apps/
  api/    Cloudflare Worker, Drizzle schema, migrations, tests
  web/    Next.js frontend and Vercel configuration
.github/
  workflows/ci.yml
```
