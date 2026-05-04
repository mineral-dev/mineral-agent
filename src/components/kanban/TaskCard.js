"use client";
import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, CircleDot, FolderKanban, GitPullRequest, Pencil, Trash2, X, Zap, Clock3 } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  ResponsiveModal,
} from "@/components/ui/responsive-modal";
import {
  TaskDetailSummary,
  TaskFormFields,
} from "./task-fields";
import { formatWorkEstimate } from "@/lib/tasks";

const STATUS_PIN_STYLES = {
  not_started: "text-slate-400",
  ready_to_start: "text-blue-500",
  in_progress: "text-amber-500",
  in_review: "text-amber-500",
  completed: "text-emerald-700",
};

const DEFAULT_FORM = {
  title: "",
  description: "",
  priority: "normal",
  project: "",
};

export function TaskCard({ task, onUpdate, onDelete, isDragging }) {
  const [view, setView] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [prMergeStatus, setPrMergeStatus] = useState(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (!task.prUrl || task.status !== "in_review") return;
    const match = task.prUrl.match(/\/pull\/(\d+)/);
    if (!match) return;
    const prNumber = match[1];
    let cancelled = false;
    fetch(`https://api.github.com/repos/mineral-dev/mineral-agent/pulls/${prNumber}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.mergeable_state === "clean" || data.mergeable === true) {
          setPrMergeStatus("clean");
        } else if (data.mergeable_state === "dirty" || data.mergeable === false) {
          setPrMergeStatus("dirty");
        } else {
          setPrMergeStatus("unknown");
        }
      })
      .catch(() => {
        if (!cancelled) setPrMergeStatus("unknown");
      });
    return () => { cancelled = true; };
  }, [task.prUrl, task.status]);

  const openEdit = useCallback(() => {
    setForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority || "normal",
      project: task.project || "",
    });
    setView("edit");
  }, [task]);

  const openDetail = useCallback(() => setView("detail"), []);
  const closeDetail = useCallback(() => setView(null), []);
  const cancelEdit = useCallback(() => setView("detail"), []);

  const save = useCallback(() => {
    if (!form.title.trim()) return;
    onUpdate(task.id, {
      title: form.title.trim(),
      description: form.description,
      priority: form.priority,
      project: form.project,
    });
    setView("detail");
  }, [form, onUpdate, task.id]);

  const deleteTask = useCallback(async () => {
    await onDelete(task.id);
    setView(null);
  }, [onDelete, task.id]);

  const showTimeWork =
    task.estimatedWork != null &&
    ["in_progress", "in_review", "completed"].includes(task.status);
  const projectLabel = task.project?.includes("/")
    ? task.project.split("/")[1]
    : task.project;
  const statusPinClass = STATUS_PIN_STYLES[task.status] || "text-slate-400";

  const detailFooter = isDesktop ? (
    <div className="flex w-full justify-between">
      <Button
        variant="outline"
        onClick={deleteTask}
        className="h-11 gap-2 border-destructive/20 px-5 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
      <div className="flex gap-3">
        <Button onClick={openEdit} className="h-11 gap-2 px-5 shadow-sm">
          <Pencil className="h-4 w-4" />
          Edit task
        </Button>
        <Button
          variant="ghost"
          onClick={closeDetail}
          className="h-11 px-4 text-muted-foreground hover:text-foreground"
        >
          Close
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex flex-col gap-2 p-4 pt-4">
      <Button onClick={openEdit} className="h-11 gap-2 shadow-sm">
        <Pencil className="h-4 w-4" />
        Edit task
      </Button>
      <Button
        variant="outline"
        onClick={deleteTask}
        className="h-11 gap-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
      <Button
        variant="ghost"
        onClick={closeDetail}
        className="h-11 text-muted-foreground hover:text-foreground"
      >
        Close
      </Button>
    </div>
  );

  const editFooter = (
    <div className="flex flex-col-reverse gap-3 p-4 pt-4 sm:flex-row sm:p-0">
      <Button variant="outline" onClick={cancelEdit} className="h-11 flex-1">
        Cancel
      </Button>
      <Button onClick={save} disabled={!form.title.trim()} className="h-11 flex-1">
        Save changes
      </Button>
    </div>
  );

  return (
    <>
      <ResponsiveModal
        open={view === "detail"}
        onOpenChange={(open) => !open && closeDetail()}
        title="Task details"
        description=""
        showDescription={false}
        footer={detailFooter}
        desktopClassName="sm:max-w-2xl p-0 gap-0 overflow-hidden"
        desktopBodyClassName="max-h-[85svh] overflow-y-auto p-6 space-y-6"
        mobileClassName="rounded-t-2xl p-0 gap-0"
        mobileBodyClassName="max-h-[85svh] overflow-y-auto pb-6 pt-4"
      >
        <TaskDetailSummary
          task={task}
          projectLabel={projectLabel}
          showTimeWork={showTimeWork}
        />
      </ResponsiveModal>

      <ResponsiveModal
        open={view === "edit"}
        onOpenChange={(open) => !open && cancelEdit()}
        title="Edit task"
        description="Update the task title, details, priority, or project."
        footer={editFooter}
        desktopClassName="sm:max-w-2xl p-0 gap-0 overflow-hidden"
        desktopBodyClassName="max-h-[85svh] overflow-y-auto p-6 space-y-6"
        mobileClassName="rounded-t-2xl p-0 gap-0"
        mobileBodyClassName="max-h-[85svh] overflow-y-auto pb-6 pt-4"
      >
        <TaskFormFields
          form={form}
          setForm={setForm}
          onSubmit={save}
          titleRequired
          titleLabel="Task title"
          titlePlaceholder="e.g. Fix login bug"
          descriptionLabel="Details"
          descriptionPlaceholder="Notes, links, or context"
          projectLabel="Project"
          projectPlaceholder="owner/repo-name"
        />
      </ResponsiveModal>

      <Card
        className={`mb-2 group relative cursor-grab overflow-hidden rounded-xl transition-all duration-200 active:cursor-grabbing ${
          isDragging
            ? "rotate-1 scale-[1.02] border-primary/30 opacity-90 shadow-xl"
            : "border-border/60 shadow-sm hover:border-border hover:shadow-md"
        }`}
        onClick={openDetail}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDetail();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Open details for ${task.title}`}
      >
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            #{task.id}
          </span>
        </div>

        <div className="space-y-2 px-3.5">
          <div className="flex items-start gap-2.5 pr-12">
            <CircleDot className={`mt-[2px] h-4 w-4 shrink-0 ${statusPinClass}`} />
            <div className="min-w-0 flex-1">
              <p className="min-w-0 flex-1 text-[13px] font-semibold leading-snug line-clamp-2 text-foreground">
                {task.title}
              </p>
            </div>
          </div>

          {task.description && (
            <p className="line-clamp-2 pl-6 text-xs leading-relaxed text-muted-foreground">
              {task.description}
            </p>
          )}

          {(task.project || showTimeWork || task.priority === "high" || (task.prUrl && task.status === "in_review")) && (
            <div className="flex flex-wrap items-center gap-1.5 pl-6 pt-0.5">
              {task.project && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  <FolderKanban className="h-2.5 w-2.5 shrink-0" />
                  {projectLabel}
                </span>
              )}
              {showTimeWork && (
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-400">
                  <Clock3 className="h-2.5 w-2.5 shrink-0" />
                  {formatWorkEstimate(task.estimatedWork)}
                </span>
              )}
              {task.priority === "high" && (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                  <Zap className="h-2.5 w-2.5" />
                  High
                </span>
              )}
              {task.prUrl && task.status === "in_review" && (
                <a
                  href={task.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={
                    prMergeStatus === "clean"
                      ? "inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 hover:underline dark:border-green-800/40 dark:bg-green-950/40 dark:text-green-400"
                      : prMergeStatus === "dirty"
                        ? "inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600 hover:underline dark:border-red-800/40 dark:bg-red-950/40 dark:text-red-400"
                        : "inline-flex items-center gap-1 rounded-full border border-violet-100 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-600 hover:underline dark:border-violet-900/40 dark:bg-violet-950/40 dark:text-violet-400"
                  }
                >
                  {prMergeStatus === "clean" ? (
                    <Check className="h-2.5 w-2.5 shrink-0" />
                  ) : prMergeStatus === "dirty" || prMergeStatus === "unknown" ? (
                    <X className="h-2.5 w-2.5 shrink-0" />
                  ) : (
                    <GitPullRequest className="h-2.5 w-2.5 shrink-0" />
                  )}
                  PR
                </a>
              )}
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
