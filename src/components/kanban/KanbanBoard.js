"use client";
import { DragDropContext } from "@hello-pangea/dnd";
import { useTasks } from "@/context/TaskContext";
import { TaskColumn } from "./TaskColumn";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function KanbanBoard() {
  const { tasks, COLUMNS, updateTask, deleteTask, moveTask, loading } = useTasks();

  const byColumn = (colId) =>
    tasks
      .filter((t) => t.status === colId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;
    await moveTask(draggableId, destination.droppableId, destination.index);
  };

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <LoadingSpinner className="scale-150" />
        </div>
      )}
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
    </div>
  );
}
