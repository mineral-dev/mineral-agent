"use client";
import { useState } from "react";
import { TaskProvider, useTasks } from "@/context/TaskContext";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { AddTaskForm } from "@/components/kanban/AddTaskForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Plus } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

function Board() {
  const { addTask, loading, tasks } = useTasks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isInitialLoading = loading && tasks.length === 0;

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
                Queue tasks for Hermes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isDesktop ? (
              <Button
                onClick={() => setDialogOpen(true)}
                size="sm"
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" />
                New Task
              </Button>
            ) : (
              <Button
                onClick={() => setDialogOpen(true)}
                size="icon"
                className="h-10 w-10 rounded-xl"
              >
                <Plus className="w-5 h-5" />
              </Button>
            )}
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
