"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  CalendarCheck2,
  CircleDot,
  Clock3,
  FolderKanban,
  GitPullRequest,
  Pencil,
  StickyNote,
  Trash2,
  Timer,
  Zap,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const PRIORITIES = [
  { value: "normal", label: "Normal", dot: "bg-muted-foreground/50" },
  { value: "high", label: "High", dot: "bg-red-500" },
];

const STATUS_LABELS = {
  not_started: "Not started",
  ready_to_start: "Ready to start",
  in_progress: "In progress",
  in_review: "In review",
  approved: "Approved",
  completed: "Completed",
};

const STATUS_PIN_STYLES = {
  not_started: "text-slate-400",
  ready_to_start: "text-blue-500",
  in_progress: "text-amber-500",
  in_review: "text-amber-500",
  approved: "text-emerald-500",
  completed: "text-emerald-700",
};

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground break-words">
        {value || "—"}
      </div>
    </div>
  );
}

function DetailMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className="mt-2 text-sm font-medium break-words text-foreground">
        {value || "—"}
      </div>
    </div>
  );
}

function EditFormInner({ form, setForm, onSubmit }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Title *
        </label>
        <Input
          placeholder="What needs to be done?"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          onKeyDown={(e) =>
            e.key === "Enter" && form.title.trim() && onSubmit()
          }
          autoFocus
          className="h-11"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Description
        </label>
        <Textarea
          placeholder="Notes, links, or context..."
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          rows={3}
          className="resize-none"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Priority
        </label>
        <div className="flex rounded-xl border border-border overflow-hidden">
          {PRIORITIES.map((p) => {
            const active = form.priority === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, priority: p.value }))}
                className={`flex-1 flex items-center justify-center gap-2 h-11 text-sm font-medium transition-colors border-r last:border-r-0 border-border
                  ${
                    active
                      ? p.value === "high"
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-foreground text-background"
                      : "bg-background text-muted-foreground hover:bg-muted/40"
                  }`}
              >
                {p.value === "high" ? (
                  <Zap
                    className={`w-3.5 h-3.5 ${active ? "text-white" : "text-red-500"}`}
                  />
                ) : (
                  <span
                    className={`w-2 h-2 rounded-full ${active ? "bg-background/60" : p.dot}`}
                  />
                )}
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Project
        </label>
        <Input
          placeholder="mineral-dev/repo-name (optional)"
          value={form.project}
          onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))}
          className="h-11 font-mono"
        />
      </div>
    </div>
  );
}

function TaskDetailInner({ task, formatTime, projectLabel, showTimeWork }) {
  const estimatedDoneTime =
    task.estimatedWork != null ? formatTime(task.estimatedWork) : "—";
  const actualDoneTime =
    task.completedAt || (task.status === "completed" ? task.updatedAt : null);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Task #{task.id}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]
              ${
                task.priority === "high"
                  ? "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  : "border-border/60 bg-muted/50 text-muted-foreground"
              }`}
          >
            {task.priority === "high" ? <Zap className="h-3 w-3" /> : null}
            {task.priority === "high" ? "High priority" : "Normal priority"}
          </span>
          <Badge variant="outline" className="rounded-full px-3 py-1">
            {STATUS_LABELS[task.status] || task.status}
          </Badge>
        </div>

        <h2 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">
          {task.title}
        </h2>
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <StickyNote className="h-4 w-4" />
          Description
        </div>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground/90">
          {task.description || "No description added."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailMetric
          icon={FolderKanban}
          label="Project"
          value={projectLabel || "—"}
        />
        <DetailMetric
          icon={Timer}
          label="Estimated Work"
          value={showTimeWork ? formatTime(task.totalWork) : "—"}
        />
        <DetailMetric
          icon={CalendarCheck2}
          label="Estimated Done Time"
          value={estimatedDoneTime}
        />
        <DetailMetric
          icon={CalendarCheck2}
          label="Actual done time"
          value={actualDoneTime ? formatDateTime(actualDoneTime) : "—"}
        />
      </div>

      {task.prUrl && task.status === "in_review" && (
        <Button
          asChild
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <a href={task.prUrl} target="_blank" rel="noopener noreferrer">
            <GitPullRequest className="w-4 h-4" />
            Open pull request
          </a>
        </Button>
      )}
    </div>
  );
}

export function TaskCard({ task, onUpdate, onDelete, isDragging }) {
  const [view, setView] = useState(null);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority || "normal",
    project: task.project || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const openEdit = useCallback(() => {
    setForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority || "normal",
      project: task.project || "",
    });
    setView("edit");
  }, [task]);

  const openDetail = useCallback(() => {
    setView("detail");
  }, []);

  const save = useCallback(async () => {
    if (!form.title.trim()) return;
    setIsSaving(true);
    try {
      await onUpdate(task.id, {
        title: form.title.trim(),
        description: form.description,
        priority: form.priority,
        project: form.project,
      });
      setView("detail");
    } finally {
      setIsSaving(false);
    }
  }, [form, onUpdate, task.id]);

  const cancelEdit = useCallback(() => setView("detail"), []);
  const closeDetail = useCallback(() => setView(null), []);
  const deleteTask = useCallback(async () => {
    await onDelete(task.id);
    setView(null);
  }, [onDelete, task.id]);

  const showTimeWork =
    task.totalWork &&
    ["in_progress", "in_review", "completed"].includes(task.status);
  const formatTime = (m) =>
    m >= 60
      ? `${Math.floor(m / 60)}h${m % 60 > 0 ? ` ${m % 60}m` : ""}`
      : `${m}m`;

  const projectLabel = task.project?.includes("/")
    ? task.project.split("/")[1]
    : task.project;

  const hasMetadata =
    task.project || showTimeWork || (task.prUrl && task.status === "in_review");
  const statusPinClass = STATUS_PIN_STYLES[task.status] || "text-slate-400";

  const formContent = (
    <EditFormInner form={form} setForm={setForm} onSubmit={save} />
  );
  const formButtons = (
    <>
      <Button variant="outline" onClick={cancelEdit} className="flex-1 h-11">
        Cancel
      </Button>
      <Button
        onClick={save}
        disabled={!form.title.trim() || isSaving}
        className="flex-1 h-11"
      >
        {isSaving ? (
          <>
            <LoadingSpinner />
            Saving
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </>
  );
  const detailContent = (
    <TaskDetailInner
      task={task}
      formatTime={formatTime}
      projectLabel={projectLabel}
      showTimeWork={showTimeWork}
    />
  );
  const detailButtons = (
    <>
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
        <Button onClick={openEdit} className="h-11 gap-2 shadow-sm sm:px-5">
          <Pencil className="w-4 h-4" />
          Edit Task
        </Button>
        <Button
          variant="outline"
          onClick={deleteTask}
          className="h-11 gap-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive sm:px-4"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
      </div>
      <Button
        variant="ghost"
        onClick={closeDetail}
        className="h-11 px-4 text-muted-foreground hover:text-foreground"
      >
        Close
      </Button>
    </>
  );

  return (
    <>
      {isDesktop ? (
        <Dialog
          open={view === "detail"}
          onOpenChange={(open) => !open && closeDetail()}
        >
          <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
            <div className="max-h-[85svh] overflow-y-auto p-6 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-lg">Task Detail</DialogTitle>
              </DialogHeader>
              {detailContent}
              <DialogFooter className="flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                {detailButtons}
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet
          open={view === "detail"}
          onOpenChange={(open) => !open && closeDetail()}
        >
          <SheetContent side="bottom" className="rounded-t-2xl p-0 gap-0">
            <div className="max-h-[85svh] overflow-y-auto pb-6 pt-4">
              <SheetHeader className="pb-4">
                <SheetTitle className="text-lg">Task Detail</SheetTitle>
              </SheetHeader>
              <div className="px-4">{detailContent}</div>
              <SheetFooter className="gap-3 pt-4">{detailButtons}</SheetFooter>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {isDesktop ? (
        <Dialog
          open={view === "edit"}
          onOpenChange={(open) => !open && cancelEdit()}
        >
          <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
            <div className="max-h-[85svh] overflow-y-auto p-6 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-lg">Edit Task</DialogTitle>
              </DialogHeader>
              {formContent}
              <DialogFooter className="flex-row gap-3">
                {formButtons}
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet
          open={view === "edit"}
          onOpenChange={(open) => !open && cancelEdit()}
        >
          <SheetContent side="bottom" className="rounded-t-2xl p-0 gap-0">
            <div className="max-h-[85svh] overflow-y-auto pb-6 pt-4">
              <SheetHeader className="pb-4">
                <SheetTitle className="text-lg">Edit Task</SheetTitle>
              </SheetHeader>
              <div className="px-4">{formContent}</div>
              <SheetFooter className="flex-row gap-3 pt-4">
                {formButtons}
              </SheetFooter>
            </div>
          </SheetContent>
        </Sheet>
      )}

      <Card
        className={`mb-2 group relative cursor-grab active:cursor-grabbing overflow-hidden transition-all duration-200 rounded-xl
          ${
            isDragging
              ? "rotate-1 opacity-90 shadow-xl border-primary/30 scale-[1.02]"
              : "shadow-sm hover:shadow-md border-border/60 hover:border-border"
          }`}
        onClick={() => setView("detail")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setView("detail");
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

        <div className="px-3.5 space-y-2">
          <div className="flex items-start gap-2.5 pr-12">
            <CircleDot
              className={`mt-[2px] h-4 w-4 shrink-0 ${statusPinClass}`}
            />
            <div className="min-w-0 flex-1">
              <p className="min-w-0 flex-1 font-semibold text-[13px] leading-snug line-clamp-2 text-foreground">
                {task.title}
              </p>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 pl-6">
              {task.description}
            </p>
          )}

          {/* Metadata chips */}
          {hasMetadata && (
            <div className="flex gap-1.5 flex-wrap items-center pl-6 pt-0.5">
              {task.project && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-muted/70 text-muted-foreground font-medium border border-border/50">
                  <FolderKanban className="w-2.5 h-2.5 shrink-0" />
                  {projectLabel}
                </span>
              )}
              {showTimeWork && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40">
                  <Clock3 className="w-2.5 h-2.5 shrink-0" />
                  {formatTime(task.totalWork)}
                </span>
              )}
              {task.priority === "high" && (
                <div className="inline-flex items-center gap-0.5 rounded-md bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                  <Zap className="h-2.5 w-2.5" />
                  High
                </div>
              )}
              {task.prUrl && task.status === "in_review" && (
                <a
                  href={task.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 font-medium border border-violet-100 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-900/40 hover:underline"
                >
                  <GitPullRequest className="w-2.5 h-2.5 shrink-0" />
                  PR
                </a>
              )}
            </div>
          )}
        </div>

        {/* Actions — appear on hover */}
      </Card>
    </>
  );
}
