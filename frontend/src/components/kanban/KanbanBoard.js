'use client';
import { DragDropContext } from '@hello-pangea/dnd';
import { useTasks } from '@/context/TaskContext';
import { TaskColumn } from './TaskColumn';
import { AddTaskForm } from './AddTaskForm';

export function KanbanBoard() {
  const { tasks, COLUMNS, refresh, addTask, updateTask, deleteTask, moveTask } = useTasks();

  const byColumn = (colId) =>
    tasks
      .filter(t => t.status === colId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId;
    const newOrder = destination.index;

    // Optimistic update
    await moveTask(draggableId, newStatus, newOrder);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 px-1">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex flex-col">
            <TaskColumn
              column={col}
              tasks={byColumn(col.id)}
              onUpdate={updateTask}
              onDelete={deleteTask}
            />
            {col.id === 'not_started' && (
              <div className="mt-2">
                <AddTaskForm onAdd={addTask} />
              </div>
            )}
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
