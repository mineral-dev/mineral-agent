"use client";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { ArrowDownToLine } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { TASK_STATUS_HELP } from "@/lib/tasks";

export function TaskColumn({ column, tasks, onUpdate, onDelete, draggedTaskStatus }) {
  const isNotStartedDrag = draggedTaskStatus === "not_started";
  const isInReviewDrag = draggedTaskStatus === "in_review";
  const isOnlyValidTarget = !isNotStartedDrag || column.id === "ready_to_start";
  const showCompletedHint = isInReviewDrag && column.id === "completed";

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
            className={`relative flex-1 min-h-[calc(100svh-8rem)] sm:min-h-[calc(100svh-10rem)] p-2 rounded-b-xl border-x border-b transition-colors ${
              column.id === "ready_to_start"
                ? snapshot.isDraggingOver
                  ? "bg-blue-500/7 border-blue-500/30"
                  : "bg-blue-500/4 border-dashed border-blue-500/15"
                : showCompletedHint && snapshot.isDraggingOver
                  ? "bg-emerald-500/15 border-emerald-500/30"
                  : "bg-muted/5"
            } ${isNotStartedDrag && !isOnlyValidTarget ? "cursor-not-allowed" : ""}`}
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
            {tasks.length === 0 &&
              !(snapshot.isDraggingOver && column.id === "ready_to_start") && (
                column.id === "ready_to_start" ? (
                  <div className="pointer-events-none absolute left-2 right-2 top-[25vh]">
                      <div className="rounded-2xl border-2 border-dashed border-blue-500/30 bg-blue-500/5 px-4 py-6 text-center shadow-sm">
                      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-500">
                        <ArrowDownToLine className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        Ready to start
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground/80">
                        Drop a not-started task here to queue it for work.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="pointer-events-none absolute left-2 right-2 top-[25vh] flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-muted-foreground">
                      {TASK_STATUS_HELP[column.id]?.emptyTitle}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {TASK_STATUS_HELP[column.id]?.emptyCopy}
                    </p>
                  </div>
                )
              )}
            {isNotStartedDrag && !isOnlyValidTarget && (
              <div className="pointer-events-none absolute inset-x-2 bottom-2 rounded-lg border border-dashed border-muted-foreground/15 bg-muted/20 px-3 py-2 text-center text-[11px] uppercase tracking-wide text-muted-foreground/70">
                Drop disabled
              </div>
            )}
            {showCompletedHint && snapshot.isDraggingOver && (
              <div className="pointer-events-none absolute inset-x-2 bottom-2 rounded-lg border border-dashed border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-[11px] uppercase tracking-wide text-emerald-600/80">
                Drop here to complete
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
