'use client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Clock, Folder, MoreHorizontal, Pencil, Trash2, Zap } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const PRIORITIES = [
  { value: 'normal', label: 'Normal', dot: 'bg-muted-foreground/50' },
  { value: 'high', label: 'High', dot: 'bg-red-500' },
];

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

export function TaskCard({ task, onUpdate, onDelete, isDragging }) {
  const [editing, setEditing] = useState(false);
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
    setEditing(true);
  }, [task]);

  const save = useCallback(() => {
    if (!form.title.trim()) return;
    onUpdate(task.id, {
      title: form.title.trim(),
      description: form.description,
      priority: form.priority,
      project: form.project,
    });
    setEditing(false);
  }, [form, onUpdate, task.id]);

  const cancel = useCallback(() => setEditing(false), []);

  const showTimeWork =
    task.totalWork && ['in_progress', 'in_review', 'completed'].includes(task.status);
  const formatTime = (m) =>
    m >= 60
      ? `${Math.floor(m / 60)}h${m % 60 > 0 ? ` ${m % 60}m` : ''}`
      : `${m}m`;

  const projectLabel = task.project?.includes('/')
    ? task.project.split('/')[1]
    : task.project;

  const formContent = <EditFormInner form={form} setForm={setForm} onSubmit={save} />;
  const formButtons = (
    <>
      <Button variant="outline" onClick={cancel} className="flex-1 h-11">
        Cancel
      </Button>
      <Button onClick={save} disabled={!form.title.trim()} className="flex-1 h-11">
        Save Changes
      </Button>
    </>
  );

  return (
    <>
      {isDesktop ? (
        <Dialog open={editing} onOpenChange={(open) => !open && cancel()}>
          <DialogContent className="sm:max-w-xl p-6 gap-4">
            <DialogHeader>
              <DialogTitle className="text-lg">Edit Task</DialogTitle>
            </DialogHeader>
            {formContent}
            <DialogFooter className="flex-row gap-3">{formButtons}</DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet open={editing} onOpenChange={(open) => !open && cancel()}>
          <SheetContent side="bottom" className="pb-6 pt-4 rounded-t-2xl">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-lg">Edit Task</SheetTitle>
            </SheetHeader>
            <div className="px-4">{formContent}</div>
            <SheetFooter className="flex-row gap-3 pt-4">{formButtons}</SheetFooter>
          </SheetContent>
        </Sheet>
      )}

      <Card
        className={`mb-2 group relative cursor-grab active:cursor-grabbing overflow-hidden transition-all
          ${task.priority === 'high' ? 'border-l-[3px] border-l-red-400' : ''}
          ${isDragging
            ? 'rotate-1 opacity-90 shadow-lg border-primary/40'
            : 'border-border hover:border-primary/30 hover:shadow-sm'
          }`}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            className="absolute top-2 right-2 h-8 w-8 rounded-lg inline-flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent z-10 focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={openEdit} className="gap-2">
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(task.id)}
              className="gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="p-3 space-y-2">
          <p className="font-medium text-sm leading-snug line-clamp-3 pr-8">{task.title}</p>
          {task.description && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {task.description}
            </p>
          )}
          {(task.priority === 'high' || task.project || showTimeWork) && (
            <div className="flex gap-1.5 flex-wrap items-center pt-0.5">
              {task.priority === 'high' && (
                <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 font-medium dark:bg-red-950/40 dark:text-red-400">
                  <Zap className="w-3 h-3" />
                  High
                </span>
              )}
              {task.project && (
                <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md bg-muted/80 text-muted-foreground">
                  <Folder className="w-3 h-3 shrink-0" />
                  {projectLabel}
                </span>
              )}
              {showTimeWork && (
                <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 font-medium dark:bg-blue-950/40 dark:text-blue-400">
                  <Clock className="w-3 h-3 shrink-0" />
                  {formatTime(task.totalWork)}
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
