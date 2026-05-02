'use client';
import { TaskProvider, useTasks } from '@/context/TaskContext';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

function Board() {
  const { refresh, loading } = useTasks();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Task Board</h1>
          <p className="text-sm text-muted-foreground">Drag cards between columns to update status</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      <KanbanBoard />
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-6">
      <TaskProvider>
        <Board />
      </TaskProvider>
    </main>
  );
}
