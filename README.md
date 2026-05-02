# Mineral Agent — Kanban Task Dashboard

A web-based Kanban board for personal task management, built with Next.js and styled with Tailwind CSS + shadcn/ui.

## Workflow Columns

Tasks flow through 5 status columns:

```
Not Started → Ready to Start → In Progress → In Review → Completed
```

- **Not Started** — Tasks added to the board start here
- **Ready to Start** — Tasks queued for Hermes Agent to pick up
- **In Progress** — Agent is actively working on the task
- **In Review** — Task done, awaiting your verification
- **Completed** — Tested and verified

## Features

- **Drag & drop** — Move tasks between columns with `@hello-pangea/dnd`
- **Task fields** — Title, description, priority (Normal/High), project tag
- **Persistent storage** — JSON file storage (no database setup needed)
- **Hermes integration** — Agent polls `ready_to_start` tasks and moves them to `in_progress` automatically
- **SWR** — Real-time data fetching with stale-while-revalidate

## Tech Stack

- **Frontend** — Next.js 16 (App Router), React 19, Tailwind CSS v4
- **UI Components** — shadcn/ui (Radix-based)
- **Drag & Drop** — `@hello-pangea/dnd`
- **Data Fetching** — SWR
- **Storage** — JSON file (`data/tasks.json`)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

Open [http://localhost:3000](http://localhost:3000) to use the board.

## Task API

All API calls are same-origin (no CORS issues):

```
GET    /api/tasks       — List all tasks
POST   /api/tasks       — Create task
PUT    /api/tasks/[id]  — Update task
DELETE /api/tasks/[id]  — Delete task
```

## Project Structure

```
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── api/tasks/        # API routes (CRUD)
│   │   ├── page.js           # Kanban board page
│   │   └── layout.js         # Root layout
│   ├── components/
│   │   ├── kanban/           # KanbanBoard, TaskColumn, TaskCard, AddTaskForm
│   │   └── ui/               # shadcn/ui components
│   ├── context/              # TaskContext (global state)
│   └── lib/                  # api.js, db.js, utils.js
├── data/
│   └── tasks.json            # Task storage
└── public/                  # Static assets
```

## Deploy

Deployed on Vercel — connects to GitHub for automatic CI/CD on push to `main`.
