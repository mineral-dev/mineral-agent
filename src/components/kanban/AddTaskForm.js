'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';

export function AddTaskForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'normal', project: '' });

  const submit = () => {
    if (!form.title.trim()) return;
    onAdd(form);
    setForm({ title: '', description: '', priority: 'normal', project: '' });
    setOpen(false);
  };

  if (!open) {
    return (
      <Button variant="default" className="w-full" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-1" /> Add Task
      </Button>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-3 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">New Task</span>
        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setOpen(false)}><X className="w-4 h-4" /></Button>
      </div>
      <Input
        placeholder="Task title *"
        value={form.title}
        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        onKeyDown={e => e.key === 'Enter' && submit()}
        autoFocus
      />
      <Input
        placeholder="Project / Git repo (optional)"
        value={form.project}
        onChange={e => setForm(f => ({ ...f, project: e.target.value }))}
      />
      <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
        <SelectTrigger className="text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="normal">Normal priority</SelectItem>
          <SelectItem value="high">High priority</SelectItem>
        </SelectContent>
      </Select>
      <Button size="sm" className="w-full" onClick={submit} disabled={!form.title.trim()}>Create Task</Button>
    </div>
  );
}
