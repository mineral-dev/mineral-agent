'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const defaultForm = { title: '', description: '', priority: 'normal', project: '' };

export function AddTaskForm({ open, onOpenChange, onAdd }) {
  const [form, setForm] = useState(defaultForm);

  const submit = async () => {
    if (!form.title.trim()) return;
    await onAdd({ ...form, status: 'not_started' });
    setForm(defaultForm);
    onOpenChange(false);
  };

  const cancel = () => {
    setForm(defaultForm);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Input
            placeholder="Task title *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && submit()}
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
              <SelectValue />
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
        <DialogFooter>
          <Button variant="outline" onClick={cancel}>Cancel</Button>
          <Button onClick={submit} disabled={!form.title.trim()}>Create Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
