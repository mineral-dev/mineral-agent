"use client";
import { DragDropContext } from "@hello-pangea/dnd";
import { useState } from "react";
import { useTasks } from "@/context/TaskContext";
import { TaskColumn } from "./TaskColumn";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const REASONS = [
  {
    value: "conflict_when_merge_to_main",
    label: "Conflict on merge",
    destStatus: "ready_to_start",
    description: "Auto-resolve conflicts and recreate PR",
  },
  {
    value: "manual_review_failed",
    label: "Manual review failed",
    destStatus: "not_started",
    description: "Human reviewer rejected — needs manual re-queue",
  },
  {
    value: "other",
    label: "Other",
    destStatus: "not_started",
    description: "Needs manual re-queue",
  },
];

export function KanbanBoard() {
  const { tasks, COLUMNS, updateTask, deleteTask, moveTask } = useTasks();

  const [pendingMove, setPendingMove] = useState(null); // { taskId, destStatus, destIndex, taskTitle }
  const [selectedReason, setSelectedReason] = useState(null);
  const [note, setNote] = useState("");

  const byColumn = (colId) => {
    let filtered = tasks
      .filter((t) => t.status === colId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Hide low-priority tasks in not_started when high/normal tasks still exist
    if (colId === "not_started") {
      const hasHighOrNormal = filtered.some(
        (t) => t.priority === "high" || t.priority === "normal"
      );
      if (hasHighOrNormal) {
        filtered = filtered.filter((t) => t.priority !== "low");
      }
    }

    // Cap completed column at 25 tasks, sorted newest first
    if (colId === "completed") return filtered.slice(-25).sort((a, b) => b.id - a.id);
    return filtered;
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const task = tasks.find((t) => String(t.id) === String(draggableId));
    if (task) {
      if (task.status === "in_progress") return;
      if (task.status === "not_started" && destination.droppableId !== "ready_to_start") return;

      // Moving from in_review → ready_to_start or not_started: require reason
      if (
        source.droppableId === "in_review" &&
        (destination.droppableId === "ready_to_start" || destination.droppableId === "not_started")
      ) {
        setPendingMove({
          taskId: draggableId,
          destStatus: destination.droppableId,
          destIndex: destination.index,
          taskTitle: task.title,
        });
        setSelectedReason(null);
        setNote("");
        return;
      }
    }

    await moveTask(draggableId, destination.droppableId, destination.index);
  };

  const handleReasonConfirm = async () => {
    if (!pendingMove || !selectedReason) return;
    const reasonDef = REASONS.find((r) => r.value === selectedReason);
    // Override destination based on selected reason (e.g. "conflict" → ready_to_start even if dragged to not_started)
    const destStatus = reasonDef ? reasonDef.destStatus : pendingMove.destStatus;
    await moveTask(pendingMove.taskId, destStatus, pendingMove.destIndex, selectedReason, note || null);
    setPendingMove(null);
    setSelectedReason(null);
    setNote("");
  };

  const handleReasonCancel = () => {
    setPendingMove(null);
    setSelectedReason(null);
    setNote("");
  };

  return (
    <>
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

      <Dialog open={!!pendingMove} onOpenChange={(open) => !open && handleReasonCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Why is this task being moved back?</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {REASONS.map((r) => (
              <label
                key={r.value}
                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                  selectedReason === r.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name="back-reason"
                  value={r.value}
                  checked={selectedReason === r.value}
                  onChange={() => setSelectedReason(r.value)}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-medium text-sm">{r.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{r.description}</div>
                </div>
              </label>
            ))}

            {selectedReason === "other" && (
              <div className="mt-2">
                <textarea
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
                  rows={2}
                  placeholder="Add a note (optional)..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleReasonCancel}>
              Cancel
            </Button>
            <Button onClick={handleReasonConfirm} disabled={!selectedReason}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
