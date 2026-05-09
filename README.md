# Mineral Agent

Mineral Agent is a lightweight Kanban dashboard for turning work requests into
tracked tasks that can be picked up by Hermes. It gives a person a clear board
for writing, prioritizing, reviewing, and completing tasks, while keeping the
task data available through simple same-origin API routes for automation.

The application is built with Next.js App Router, React, Tailwind CSS, and
shadcn/ui components. Task state is persisted in PostgreSQL through
`DATABASE_URL`, so the board can be deployed without relying on browser-only
state or local files.

## Purpose

This project exists to make agent-driven task handling visible and manageable.
Instead of dropping requests into chat history or an external tracker, tasks are
captured as cards, moved through a consistent workflow, and updated as Hermes
or a human reviewer changes their status.

Mineral Agent is useful when you want to:

- Capture a task with enough context for an agent or reviewer to act on it.
- Prioritize work and separate queued tasks from active work.
- Track the handoff from human request to Hermes execution.
- Review completed agent work before marking it done.
- Expose the same task data to UI users and automation through HTTP endpoints.

## Workflow

Tasks move through five columns:

```text
Not Started -> Ready to Start -> In Progress -> In Review -> Completed
```

- **Not Started**: newly created tasks that still need triage.
- **Ready to Start**: tasks that are prepared for Hermes to pick up.
- **In Progress**: work that is actively being handled.
- **In Review**: finished work that needs human verification.
- **Completed**: verified work that is done.

The board supports direct drag-and-drop between columns. Moving a task to
`in_progress` records a start time when one does not already exist, allowing the
UI to display estimated timing when `totalWork` is available.

## Key Capabilities

- **Kanban task board**: five status columns with card counts and horizontal
  scrolling for focused task management.
- **Task creation**: add a title, description, priority, and project tag from a
  dialog on desktop or a bottom sheet on mobile.
- **Inline task editing**: update title, description, and priority from each
  card without leaving the board.
- **Priority signals**: high-priority tasks are visually marked for fast
  scanning.
- **Project labels**: optional project tags help group work across repos or
  initiatives.
- **Work estimates**: tasks can carry `totalWork` in minutes, and active tasks
  can show an ETA or overdue indicator.
- **Persistent storage**: PostgreSQL stores tasks, ordering, timestamps, status,
  priority, project, and work estimates.
- **Automation-friendly API**: Next.js route handlers expose CRUD endpoints that
  return JSON payloads shaped for both the UI and Hermes.

## How It Fits Together

The app is split into a small set of focused layers:

- `src/app/page.js` renders the main board shell and task creation entry point.
- `src/context/TaskContext.js` owns client-side task state, loads tasks from the
  API, and exposes actions for adding, updating, deleting, and moving cards.
- `src/components/kanban/` contains the board, columns, task cards, and task
  creation form.
- `src/lib/api.js` wraps browser `fetch` calls to the task API.
- `src/app/api/tasks/` contains Next.js route handlers for listing and creating
  tasks.
- `src/app/api/tasks/[id]/` contains route handlers for reading, updating, and
  deleting one task.
- `src/lib/db.js` initializes the PostgreSQL schema and maps database rows to
  the task objects used by the UI.

At runtime, the browser loads tasks through `/api/tasks`, stores them in
`TaskContext`, and renders them into the Kanban columns. User actions call the
same API routes that automation can use, keeping the UI and agent workflow on a
shared task model.

## Task Data Model

Each task includes:

- `id`: numeric database identifier.
- `title`: required task title.
- `description`: optional notes, links, or implementation context.
- `priority`: `normal` or `high`.
- `project`: optional project or repository label.
- `status`: one of the five workflow statuses.
- `order`: numeric ordering value used by the board.
- `totalWork`: optional estimated work in minutes.
- `startedAt`: timestamp set when work enters `in_progress`.
- `createdAt` and `updatedAt`: database timestamps for auditing changes.

## API

All API calls are same-origin and return JSON.

```text
GET    /api/tasks       List all tasks
POST   /api/tasks       Create a task
GET    /api/tasks/[id]  Read one task
PUT    /api/tasks/[id]  Update one task
DELETE /api/tasks/[id]  Delete one task
```

Create and update requests accept a `data` object:

```json
{
  "data": {
    "title": "Implement dashboard filter",
    "description": "Add project and priority filtering to the board.",
    "priority": "high",
    "project": "mineral-agent",
    "status": "ready_to_start",
    "totalWork": 90
  }
}
```

Responses wrap task payloads in `data`:

```json
{
  "data": {
    "id": 1,
    "title": "Implement dashboard filter",
    "description": "Add project and priority filtering to the board.",
    "priority": "high",
    "project": "mineral-agent",
    "status": "ready_to_start",
    "order": 0,
    "totalWork": 90,
    "createdAt": "2026-05-03 10:00:00+00",
    "updatedAt": "2026-05-03 10:00:00+00",
    "startedAt": null
  }
}
```

## Tech Stack

- **Framework**: Next.js 16 App Router
- **UI**: React 19, Tailwind CSS v4, shadcn/ui, Radix primitives
- **Drag and drop**: `@hello-pangea/dnd`
- **Icons**: `lucide-react`
- **Storage**: PostgreSQL via `pg`
- **Tooling**: ESLint, pnpm

## Getting Started

Install dependencies:

```bash
pnpm install
```

Set a PostgreSQL connection string:

```bash
export DATABASE_URL="postgres://user:password@localhost:5432/mineral_agent"
```

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to use the board.

The database schema is created automatically on the first request if the `tasks`
table does not already exist.

## Scripts

```bash
pnpm dev      # Start the local development server
pnpm build    # Build the production app
pnpm start    # Start the production server
pnpm lint     # Run ESLint
```

## Project Structure

```text
src/
  app/
    api/tasks/          Task API route handlers
    layout.js           Root application layout
    page.js             Kanban board page
  components/
    kanban/             Board, columns, cards, and task form
    ui/                 shadcn/ui building blocks
  context/              TaskProvider and useTasks hook
  hooks/                Responsive behavior helpers
  lib/                  API client, database access, utilities
```

## Deployment

The app is intended to run on Vercel or another Next.js-compatible host. Provide
`DATABASE_URL` in the deployment environment so the API routes can connect to
PostgreSQL. Once deployed, pushes to `main` can trigger the normal CI/CD flow
for the hosted board.

<!-- Task #13 test marker -->
