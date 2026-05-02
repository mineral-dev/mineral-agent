'use client';
import { DragDropContext } from '@hello-pangea/dnd';
import { useTasks } from '@/context/TaskContext';
import { TaskColumn } from './TaskColumn';

export function KanbanBoard() {
  const { tasks, COLUMNS, updateTask, deleteTask, moveTask } = useTasks();

  const byColumn = (colId) =>
    tasks
      .filter(t => t.status === colId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    await moveTask(draggableId, destination.droppableId, destination.index);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 px-1">
        {COLUMNS.map(col => (
          <TaskColumn
            key={col.id}
            column={col}
            tasks={byColumn(col.id)}
            onUpdate={updateTask}
            onDelete={deleteTask}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
