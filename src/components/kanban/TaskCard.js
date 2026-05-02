'use client';
import { Card } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, X, Check } from 'lucide-react';
import { useState } from 'react';

const PRIORITIES = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
];

export function TaskCard({ task, onUpdate, onDelete, isDragging }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority || 'normal',
  });

  const handlePriorityChange = (value) => {
    setForm((f) => ({ ...f, priority: value }));
  };

  const save = () => {
    onUpdate(task.id, {
      title: form.title,
      description: form.description,
      priority: form.priority,
    });
    setEditing(false);
  };

  const cancel = () => {
    setEditing(false);
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'normal',
    });
  };

  if (editing) {
    return (
      <Card className="mb-2 p-3 space-y-3 border-border shadow-sm">
        <Input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="h-10 font-medium"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && form.title.trim() && save()}
        />
        <Textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Add description..."
          rows={2}
          className="resize-none text-sm"
        />
        <Select value={form.priority} onValueChange={handlePriorityChange}>
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                <span className="flex items-center gap-2">
                  {p.value === 'high' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  )}
                  {p.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={save} disabled={!form.title.trim()} className="gap-1.5">
            <Check className="w-3.5 h-3.5" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={cancel} className="gap-1.5">
            <X className="w-3.5 h-3.5" />
            Cancel
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`mb-2 group cursor-grab active:cursor-grabbing transition-all border-border
        ${isDragging
          ? 'shadow-xl rotate-1 opacity-90'
          : 'shadow-sm hover:shadow-md hover:border-primary/30'
        }`}
    >
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm leading-tight line-clamp-2 flex-1">{task.title}</p>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="h-8 w-8 rounded-lg inline-flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setEditing(true)} className="gap-2">
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
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}
        {(task.priority === 'high' || task.project) && (
          <div className="flex gap-1.5 flex-wrap pt-1">
            {task.priority === 'high' && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium">
                <span className="w-1 h-1 rounded-full bg-red-500" />
                High Priority
              </span>
            )}
            {task.project && (
              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                {task.project}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
