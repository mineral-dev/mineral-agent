'use client';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Plus } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const defaultForm = { title: '', description: '', priority: 'normal', project: '' };

function TaskFormInner({ form, setForm, onSubmit, onCancel, isSubmitting, error }) {
  return (
    <>
      {error && (
        <p className="text-sm text-destructive mb-2">{error}</p>
      )}
      <div className="space-y-3 py-2">
        <Input
          placeholder="Task title *"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && form.title.trim() && onSubmit()}
          autoFocus
        />
        <Textarea
          placeholder="Description (optional)"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={3}
        />
        <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
          <SelectTrigger>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal priority</SelectItem>
            <SelectItem value="high">High priority</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Project (optional)"
          value={form.project}
          onChange={e => setForm(f => ({ ...f, project: e.target.value }))}
        />
      </div>
      <SheetFooter className="flex flex-row gap-3 mt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!form.title.trim() || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Creating…' : 'Create Task'}
        </Button>
      </SheetFooter>
    </>
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
      setError('Failed to create task. Please try again.');
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
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
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>New Task</SheetTitle>
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
