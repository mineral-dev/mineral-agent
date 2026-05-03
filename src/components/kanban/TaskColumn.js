"use client";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { TaskCard } from "./TaskCard";

export function TaskColumn({ column, tasks, onUpdate, onDelete }) {
  return (
    <div className="w-64 sm:w-72 shrink-0 flex flex-col min-h-full translate-x-4 sm:translate-x-6">
      <div
        className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl border border-b-0 border-x ${column.borderColor}`}
        style={{ borderLeftWidth: "3px" }}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${column.dotColor}`}
          />
          <span className="font-medium text-sm">{column.label}</span>
        </div>
        <span className="text-xs font-medium bg-muted/60 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-[calc(100svh-8rem)] sm:min-h-[calc(100svh-10rem)] p-2 rounded-b-xl border-x border-b transition-colors ${
              snapshot.isDraggingOver
                ? "bg-primary/5 border-primary/20"
                : "bg-muted/5"
            }`}
          >
            {tasks.map((task, index) => (
              <Draggable
                key={task.id}
                draggableId={String(task.id)}
                index={index}
              >
                {(prov, snap) => (
                  <div
                    ref={prov.innerRef}
                    {...prov.draggableProps}
                    {...prov.dragHandleProps}
                  >
                    <TaskCard
                      task={task}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                      isDragging={snap.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-xs text-muted-foreground">
                  Nothing here yet
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Drop a task here to move it
                </p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
