'use client';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Plus, X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const defaultForm = { title: '', description: '', priority: 'normal', project: '' };

const PRIORITIES = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
];

function TaskFormInner({ form, setForm, onSubmit, onCancel, isSubmitting, error }) {
  const handlePriorityChange = (value) => {
    setForm((f) => ({ ...f, priority: value }));
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-3 py-2">
          {error}
        </div>
      )}
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
            placeholder="Add more details..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="resize-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Priority</label>
          <Select value={form.priority} onValueChange={handlePriorityChange}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  <span className="flex items-center gap-2">
                    {p.value === 'high' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    )}
                    {p.value === 'normal' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    )}
                    {p.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Project</label>
          <Input
            placeholder="Add project name (optional)"
            value={form.project}
            onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))}
            className="h-11"
          />
        </div>
      </div>
      <SheetFooter className="flex-row gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 h-11"
        >
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!form.title.trim() || isSubmitting}
          className="flex-1 h-11"
        >
          {isSubmitting ? 'Creating...' : 'Create Task'}
        </Button>
      </SheetFooter>
    </div>
  );
}

export function AddTaskForm({ open, onOpenChange, onAdd }) {
  const [form, setForm] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const submit = useCallback(async () => {
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onAdd({ ...form, status: 'not_started' });
      setForm(defaultForm);
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [form, isSubmitting, onAdd, onOpenChange]);

  const cancel = () => {
    setForm(defaultForm);
    setError(null);
    onOpenChange(false);
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">Create New Task</DialogTitle>
            <DialogDescription className="text-sm">
              Add a new task to your board
            </DialogDescription>
          </DialogHeader>
          <TaskFormInner
            form={form}
            setForm={setForm}
            onSubmit={submit}
            onCancel={cancel}
            isSubmitting={isSubmitting}
            error={error}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="px-4 pb-6 pt-4 rounded-t-2xl">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">New Task</SheetTitle>
          </div>
          <SheetDescription className="text-sm">
            Create a new task for your board
          </SheetDescription>
        </SheetHeader>
        <TaskFormInner
          form={form}
          setForm={setForm}
          onSubmit={submit}
          onCancel={cancel}
          isSubmitting={isSubmitting}
          error={error}
        />
      </SheetContent>
    </Sheet>
  );
}
