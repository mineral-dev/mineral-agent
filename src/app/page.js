'use client';
import { useState } from 'react';
import { TaskProvider, useTasks } from '@/context/TaskContext';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { AddTaskForm } from '@/components/kanban/AddTaskForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

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

  const statsLine = COLUMNS
    .map(col => `${tasks.filter(t => t.status === col.id).length} ${STAT_LABELS[col.id]}`)
    .join(' · ');

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Mineral Agent</h1>
          <p className="text-sm text-muted-foreground">Personal task board</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Task
        </Button>
      </header>
      <div className="px-6 py-2 border-b">
        <p className="text-sm text-muted-foreground">{statsLine}</p>
      </div>
      <main className="flex-1 p-6 overflow-x-auto">
        <KanbanBoard />
      </main>
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
