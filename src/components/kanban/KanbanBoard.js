"use client";
import { DragDropContext } from "@hello-pangea/dnd";
import { useTasks } from "@/context/TaskContext";
import { TaskColumn } from "./TaskColumn";

export function KanbanBoard() {
  const { tasks, COLUMNS, updateTask, deleteTask, moveTask } = useTasks();

  const byColumn = (colId) => {
    const filtered = tasks
      .filter((t) => t.status === colId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    // Cap completed column at 25 tasks, sorted newest first
    if (colId === 'completed') return filtered.slice(-25).sort((a, b) => b.id - a.id);
    return filtered;
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;
    const task = tasks.find((t) => String(t.id) === String(draggableId));
    if (task) {
      if (task.status === 'in_progress') return;
      if (task.status === 'not_started' && destination.droppableId !== 'ready_to_start') return;
    }
    await moveTask(draggableId, destination.droppableId, destination.index);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 pr-16 sm:pr-32 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {COLUMNS.map((col) => (
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
