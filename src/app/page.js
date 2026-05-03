"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TaskProvider, useTasks } from "@/context/TaskContext";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { AddTaskForm } from "@/components/kanban/AddTaskForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Plus, LogOut } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

function Board() {
  const router = useRouter();
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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b border-border/80 bg-background/85 backdrop-blur-xl shrink-0">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-base font-semibold">Mineral Agent</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Manage tasks for the AI agent to work on
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

      {/* Main content */}
      <main className="flex-1 py-4 transition-colors duration-300 sm:py-6">
        <KanbanBoard />
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-border/60 px-4 sm:px-6 py-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Mineral Dev
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </Button>
      </footer>

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
