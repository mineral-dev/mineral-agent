"use client";
import { useState } from "react";
import { TaskProvider, useTasks } from "@/context/TaskContext";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { AddTaskForm } from "@/components/kanban/AddTaskForm";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Plus } from "lucide-react";

function Board() {
  const { addTask, loading, tasks, error, refresh } = useTasks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const isInitialLoading = loading && tasks.length === 0 && !error;

  if (error && tasks.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-sm rounded-2xl border border-border/80 bg-card p-6 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Unable to load tasks</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Refresh the board to try again.
          </p>
          <Button className="mt-4" onClick={refresh}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" className="text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
      <header className="sticky top-0 z-10 border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-base font-semibold">Mineral Agent</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Queue tasks, move them through review, and keep the board in sync
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              onClick={() => setDialogOpen(true)}
              className="h-10 w-10 rounded-xl px-0 sm:w-auto sm:px-4 sm:gap-1.5"
            >
              <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Add task</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 py-4 transition-colors duration-300 sm:py-6">
        <KanbanBoard onAdd={addTask} className="min-h-full" />
      </main>

      <AddTaskForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={addTask}
      />
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-background">
      <TaskProvider>
        <Board />
      </TaskProvider>
    </div>
  );
}
