'use client';
import { useState } from 'react';
import { TaskProvider, useTasks } from '@/context/TaskContext';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { AddTaskForm } from '@/components/kanban/AddTaskForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const STAT_LABELS = {
  not_started:    'not started',
  ready_to_start: 'ready to start',
  in_progress:    'in progress',
  in_review:      'in review',
  completed:      'completed',
};

function Board() {
  const { tasks, COLUMNS, addTask } = useTasks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const statsLine = COLUMNS
    .map(col => `${tasks.filter(t => t.status === col.id).length} ${STAT_LABELS[col.id]}`)
    .join(' · ');

  return (
    <div className="relative flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Mineral Agent</h1>
          <p className="text-sm text-muted-foreground">Personal task board</p>
        </div>
        {isDesktop && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Task
          </Button>
        )}
      </header>
      <div className="px-6 py-2 border-b">
        <p className="text-sm text-muted-foreground">{statsLine}</p>
      </div>
      <main className="flex-1 overflow-x-auto p-6 flex items-stretch">
        <KanbanBoard onAdd={addTask} className="min-h-full" />
      </main>

      {/* Mobile FAB — only shown on mobile */}
      {!isDesktop && (
        <button
          onClick={() => setDialogOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg active:scale-95 active:bg-primary/80 flex items-center justify-center transition-all z-50"
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
