'use client';
import { useState } from 'react';
import { TaskProvider, useTasks } from '@/context/TaskContext';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { AddTaskForm } from '@/components/kanban/AddTaskForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

function Board() {
  const { tasks, addTask } = useTasks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <div className="relative flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">M</span>
            </div>
            <div>
              <h1 className="text-base font-semibold">Mineral Agent</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Task Board</p>
            </div>
          </div>
          {isDesktop ? (
            <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          ) : (
            <Button onClick={() => setDialogOpen(true)} size="icon" className="h-10 w-10 rounded-xl">
              <Plus className="w-5 h-5" />
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6">
        <KanbanBoard onAdd={addTask} className="min-h-full" />
      </main>

      {/* Mobile FAB */}
      {!isDesktop && (
        <button
          onClick={() => setDialogOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-2xl shadow-lg active:scale-95 active:bg-primary/90 flex items-center justify-center transition-all z-50"
          aria-label="Add new task"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <AddTaskForm open={dialogOpen} onOpenChange={setDialogOpen} onAdd={addTask} />
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
