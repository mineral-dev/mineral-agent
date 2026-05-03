import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarCheck2,
  Clock3,
  FolderKanban,
  GitPullRequest,
  StickyNote,
  Zap,
} from "lucide-react";
import {
  TASK_PRIORITIES,
  TASK_STATUS_LABELS,
  formatTaskDateTime,
  formatWorkEstimate,
} from "@/lib/tasks";

export function TaskFormFields({
  form,
  setForm,
  titleLabel = "Task title",
  titlePlaceholder = "What needs to be done?",
  descriptionLabel = "Details",
  descriptionPlaceholder = "Notes, links, or context",
  priorityLabel = "Priority",
  projectLabel = "Project",
  projectPlaceholder = "owner/repo-name",
  titleRequired = false,
  onSubmit,
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {titleLabel}{titleRequired ? " *" : ""}
        </label>
        <Input
          placeholder={titlePlaceholder}
          value={form.title}
          onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && form.title.trim() && onSubmit?.()}
          autoFocus
          className="h-11"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {descriptionLabel}
        </label>
        <Textarea
          placeholder={descriptionPlaceholder}
          value={form.description}
          onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
          rows={3}
          className="resize-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {priorityLabel}
        </label>
        <div className="flex overflow-hidden rounded-xl border border-border">
          {TASK_PRIORITIES.map((priority) => {
            const active = form.priority === priority.value;
            return (
              <button
                key={priority.value}
                type="button"
                onClick={() => setForm((current) => ({ ...current, priority: priority.value }))}
                className={`flex h-11 flex-1 items-center justify-center gap-2 border-r border-border text-sm font-medium transition-colors last:border-r-0 ${
                  active
                    ? priority.value === "high"
                      ? "border-red-500 bg-red-500 text-white"
                      : "bg-foreground text-background"
                    : "bg-background text-muted-foreground hover:bg-muted/40"
                }`}
              >
                {priority.value === "high" ? (
                  <Zap className={`h-3.5 w-3.5 ${active ? "text-white" : "text-red-500"}`} />
                ) : (
                  <span
                    className={`h-2 w-2 rounded-full ${active ? "bg-background/60" : priority.dot}`}
                  />
                )}
                {priority.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {projectLabel}
        </label>
        <Input
          placeholder={projectPlaceholder}
          value={form.project}
          onChange={(e) => setForm((current) => ({ ...current, project: e.target.value }))}
          className="h-11 font-mono"
        />
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
      <div className="mt-2 break-words text-sm font-medium text-foreground">
        {value || "Not tracked"}
      </div>
    </div>
  );
}

export function TaskDetailSummary({ task, projectLabel, showTimeWork }) {
  const actualDoneTime = task.completedAt || (task.status === "completed" ? task.updatedAt : null);
  const statusLabel = TASK_STATUS_LABELS[task.status] || task.status;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Task #{task.id}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
              task.priority === "high"
                ? "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                : "border-border/60 bg-muted/50 text-muted-foreground"
            }`}
          >
            {task.priority === "high" ? <Zap className="h-3 w-3" /> : null}
            {task.priority === "high" ? "High priority" : "Normal priority"}
          </span>
          <Badge variant="outline" className="rounded-full px-3 py-1">
            {statusLabel}
          </Badge>
        </div>

        <h2 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">
          {task.title}
        </h2>
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <StickyNote className="h-4 w-4" />
          Task notes
        </div>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground/90">
          {task.description || "Add context so the agent knows what to do."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailMetric
          icon={FolderKanban}
          label="Project"
          value={projectLabel || "—"}
        />
        <DetailMetric
          icon={Clock3}
          label="Work estimate"
          value={showTimeWork ? formatWorkEstimate(task.estimatedWork) : "—"}
        />
        <DetailMetric
          icon={CalendarCheck2}
          label="Created at"
          value={formatTaskDateTime(task.createdAt)}
        />
        <DetailMetric
          icon={CalendarCheck2}
          label="Completed at"
          value={actualDoneTime ? formatTaskDateTime(actualDoneTime) : "—"}
        />
      </div>

      {task.prUrl && task.status === "in_review" && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 text-sm text-foreground">
          <a href={task.prUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-violet-600 hover:underline dark:text-violet-400">
            <GitPullRequest className="h-4 w-4" />
            Open pull request
          </a>
        </div>
      )}
    </div>
  );
}
