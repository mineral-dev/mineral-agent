'use client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

export function TaskCard({ task, onUpdate, onDelete, isDragging }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: task.title, description: task.description || '' });

  const save = () => {
    onUpdate(task.id, form);
    setEditing(false);
  };

  if (editing) {
    return (
      <Card className="mb-2 p-3 space-y-2 border-border shadow-sm">
        <Input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="text-sm font-medium"
          autoFocus
          onKeyDown={e => e.key === 'Enter' && save()}
        />
        <Textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Description (optional)"
          rows={2}
          className="text-xs"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={save}>Save</Button>
          <Button size="sm" variant="outline" onClick={() => {
            setEditing(false);
            setForm({ title: task.title, description: task.description || '' });
          }}>Cancel</Button>
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
      <div className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm leading-tight line-clamp-1 flex-1">{task.title}</p>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="h-11 w-11 rounded-xl inline-flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              onMouseDown={e => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(true)}>
                <Pencil className="w-3.5 h-3.5 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(task.id)}>
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}
        {(task.priority === 'high' || task.project) && (
          <div className="flex gap-1.5 flex-wrap">
            {task.priority === 'high' && (
              <span className="inline-flex items-center text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 font-medium">High</span>
            )}
            {task.project && (
              <span className="inline-flex items-center text-xs px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground border border-border">{task.project}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
