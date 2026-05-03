'use client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Clock, Folder, GitPullRequest, Pencil, Trash2, Zap } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const PRIORITIES = [
  { value: 'normal', label: 'Normal', dot: 'bg-muted-foreground/50' },
  { value: 'high', label: 'High', dot: 'bg-red-500' },
];

const STATUS_LABELS = {
  not_started: 'Not started',
  ready_to_start: 'Ready to start',
  in_progress: 'In progress',
  in_review: 'In review',
  approved: 'Approved',
  completed: 'Completed',
};

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground break-words">
        {value || '—'}
      </div>
    </div>
  );
}

function EditFormInner({ form, setForm, onSubmit }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Title *</label>
        <Input
          placeholder="What needs to be done?"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && form.title.trim() && onSubmit()}
          autoFocus
          className="h-11"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
        <Textarea
          placeholder="Notes, links, or context..."
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          className="resize-none"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Priority</label>
        <div className="flex rounded-xl border border-border overflow-hidden">
          {PRIORITIES.map((p) => {
            const active = form.priority === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, priority: p.value }))}
                className={`flex-1 flex items-center justify-center gap-2 h-11 text-sm font-medium transition-colors border-r last:border-r-0 border-border
                  ${active
                    ? p.value === 'high'
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-foreground text-background'
                    : 'bg-background text-muted-foreground hover:bg-muted/40'
                  }`}
              >
                {p.value === 'high' ? (
                  <Zap className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-red-500'}`} />
                ) : (
                  <span className={`w-2 h-2 rounded-full ${active ? 'bg-background/60' : p.dot}`} />
                )}
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Project</label>
        <Input
          placeholder="mineral-dev/repo-name (optional)"
          value={form.project}
          onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))}
          className="h-11"
        />
      </div>
    </div>
  );
}

function TaskDetailInner({ task, formatTime, projectLabel, showTimeWork }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="rounded-full">
          {STATUS_LABELS[task.status] || task.status}
        </Badge>
        <Badge
          variant={task.priority === 'high' ? 'destructive' : 'secondary'}
          className="rounded-full"
        >
          {task.priority === 'high' ? 'High priority' : 'Normal priority'}
        </Badge>
        {task.project && (
          <Badge variant="outline" className="rounded-full">
            {projectLabel}
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-semibold leading-tight text-foreground sm:text-2xl">
          {task.title}
        </h2>
        <p className="text-sm text-muted-foreground">Task #{task.id}</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Description
        </div>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground/90">
          {task.description || 'No description added.'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailRow label="Project" value={projectLabel || '—'} />
        <DetailRow label="Status" value={STATUS_LABELS[task.status] || task.status} />
        <DetailRow
          label="Work logged"
          value={showTimeWork ? formatTime(task.totalWork) : '—'}
        />
        <DetailRow label="PR Url" value={task.prUrl && task.status === 'in_review' ? 'Attached' : '—'} />
        <DetailRow label="Created" value={formatDateTime(task.createdAt)} />
        <DetailRow label="Updated" value={formatDateTime(task.updatedAt)} />
      </div>

      {task.prUrl && task.status === 'in_review' && (
        <Button asChild variant="outline" className="w-full justify-start gap-2">
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
    description: task.description || '',
    priority: task.priority || 'normal',
    project: task.project || '',
  });
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const openEdit = useCallback(() => {
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'normal',
      project: task.project || '',
    });
    setView('edit');
  }, [task]);

  const openDetail = useCallback(() => {
    setView('detail');
  }, []);

  const save = useCallback(() => {
    if (!form.title.trim()) return;
    onUpdate(task.id, {
      title: form.title.trim(),
      description: form.description,
      priority: form.priority,
      project: form.project,
    });
    setView('detail');
  }, [form, onUpdate, task.id]);

  const cancelEdit = useCallback(() => setView('detail'), []);
  const closeDetail = useCallback(() => setView(null), []);
  const deleteTask = useCallback(async () => {
    await onDelete(task.id);
    setView(null);
  }, [onDelete, task.id]);

  const showTimeWork =
    task.totalWork && ['in_progress', 'in_review', 'completed'].includes(task.status);
  const formatTime = (m) =>
    m >= 60
      ? `${Math.floor(m / 60)}h${m % 60 > 0 ? ` ${m % 60}m` : ''}`
      : `${m}m`;

  const projectLabel = task.project?.includes('/')
    ? task.project.split('/')[1]
    : task.project;

  const hasMetadata = task.project || showTimeWork || (task.prUrl && task.status === 'in_review');

  const formContent = <EditFormInner form={form} setForm={setForm} onSubmit={save} />;
  const formButtons = (
    <>
      <Button variant="outline" onClick={cancelEdit} className="flex-1 h-11">
        Cancel
      </Button>
      <Button onClick={save} disabled={!form.title.trim()} className="flex-1 h-11">
        Save Changes
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
      <Button
        variant="ghost"
        onClick={closeDetail}
        className="h-11 px-4 text-muted-foreground hover:text-foreground"
      >
        Close
      </Button>
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          onClick={deleteTask}
          className="h-11 gap-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive sm:px-4"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
        <Button onClick={openEdit} className="h-11 gap-2 shadow-sm sm:px-5">
          <Pencil className="w-4 h-4" />
          Edit Task
        </Button>
      </div>
    </>
  );

  return (
    <>
      {isDesktop ? (
        <Dialog open={view === 'detail'} onOpenChange={(open) => !open && closeDetail()}>
          <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
            <div className="max-h-[85svh] overflow-y-auto p-6 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-lg">Task Details</DialogTitle>
              </DialogHeader>
              {detailContent}
              <DialogFooter className="flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                {detailButtons}
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet open={view === 'detail'} onOpenChange={(open) => !open && closeDetail()}>
          <SheetContent side="bottom" className="rounded-t-2xl p-0 gap-0">
            <div className="max-h-[85svh] overflow-y-auto pb-6 pt-4">
              <SheetHeader className="pb-4">
                <SheetTitle className="text-lg">Task Details</SheetTitle>
              </SheetHeader>
              <div className="px-4">{detailContent}</div>
              <SheetFooter className="gap-3 pt-4">
                {detailButtons}
              </SheetFooter>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {isDesktop ? (
        <Dialog open={view === 'edit'} onOpenChange={(open) => !open && cancelEdit()}>
          <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
            <div className="max-h-[85svh] overflow-y-auto p-6 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-lg">Edit Task</DialogTitle>
              </DialogHeader>
              {formContent}
              <DialogFooter className="flex-row gap-3">{formButtons}</DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet open={view === 'edit'} onOpenChange={(open) => !open && cancelEdit()}>
          <SheetContent side="bottom" className="rounded-t-2xl p-0 gap-0">
            <div className="max-h-[85svh] overflow-y-auto pb-6 pt-4">
              <SheetHeader className="pb-4">
                <SheetTitle className="text-lg">Edit Task</SheetTitle>
              </SheetHeader>
              <div className="px-4">{formContent}</div>
              <SheetFooter className="flex-row gap-3 pt-4">{formButtons}</SheetFooter>
            </div>
          </SheetContent>
        </Sheet>
      )}

      <Card
        className={`mb-2 group relative cursor-grab active:cursor-grabbing overflow-hidden transition-all duration-200 rounded-xl
          ${isDragging
            ? 'rotate-1 opacity-90 shadow-xl border-primary/30 scale-[1.02]'
            : 'shadow-sm hover:shadow-md border-border/60 hover:border-border'
          }`}
        onClick={() => setView('detail')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setView('detail');
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Open details for ${task.title}`}
      >
        {/* High priority top accent strip */}
        {task.priority === 'high' && (
          <div className="h-[3px] w-full bg-gradient-to-r from-red-400 via-orange-400 to-red-400" />
        )}

        <div className="p-3.5 space-y-2">
          {/* Title row with priority dot */}
          <div className="flex items-start gap-2.5 pr-7">
            <div
              className={`mt-[5px] w-2 h-2 rounded-full shrink-0 ring-[1.5px] ring-offset-[1.5px] ring-offset-card transition-colors
                ${task.priority === 'high'
                  ? 'bg-red-400 ring-red-300'
                  : 'bg-muted-foreground/20 ring-transparent'
                }`}
            />
            <p className="font-semibold text-[13px] leading-snug line-clamp-2 flex-1 text-foreground">
              {task.title}
            </p>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 pl-[18px]">
              {task.description}
            </p>
          )}

          {/* Metadata chips */}
          {hasMetadata && (
            <div className="flex gap-1.5 flex-wrap items-center pl-[18px] pt-0.5">
              {task.project && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-muted/70 text-muted-foreground font-medium border border-border/50">
                  <Folder className="w-2.5 h-2.5 shrink-0" />
                  {projectLabel}
                </span>
              )}
              {showTimeWork && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40">
                  <Clock className="w-2.5 h-2.5 shrink-0" />
                  {formatTime(task.totalWork)}
                </span>
              )}
              {task.prUrl && task.status === 'in_review' && (
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

        {/* High priority badge — bottom-right */}
        {task.priority === 'high' && (
          <div className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-red-50 text-red-500 font-semibold dark:bg-red-950/40 dark:text-red-400">
            <Zap className="w-2.5 h-2.5" />
            High
          </div>
        )}

        {/* Actions — appear on hover */}
      </Card>
    </>
  );
}
