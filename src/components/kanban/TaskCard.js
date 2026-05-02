'use client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Clock,
  Folder,
  MoreHorizontal,
  Pencil,
  Trash2,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const PRIORITIES = [
  { value: 'normal', label: 'Normal', dot: 'bg-muted-foreground/50' },
  { value: 'high', label: 'High', dot: 'bg-red-500' },
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
      <Card className="mb-2 p-3 space-y-1.5 border-primary/40 ring-1 ring-primary/10">
        <Textarea
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
          className="resize-none overflow-hidden min-h-0 text-sm font-medium border-none shadow-none bg-transparent focus-visible:ring-0 px-0 py-0 leading-snug"
          rows={1}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); form.title.trim() && save(); }
            if (e.key === 'Escape') cancel();
          }}
        />
        <Textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          onKeyDown={(e) => e.key === 'Escape' && cancel()}
          placeholder="Notes..."
          rows={1}
          className="resize-none min-h-0 text-xs text-muted-foreground border-none shadow-none bg-transparent focus-visible:ring-0 px-0 py-0 leading-snug"
        />
        {task.project && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border w-fit">
            <Folder className="w-3 h-3 shrink-0" />
            {task.project}
          </span>
        )}
        <div className="flex rounded-lg border border-border overflow-hidden">
          {PRIORITIES.map((p) => {
            const active = form.priority === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => handlePriorityChange(p.value)}
                className={`flex-1 flex items-center justify-center gap-1 h-7 text-xs font-medium transition-colors border-r last:border-r-0 border-border
                  ${active
                    ? p.value === 'high'
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-foreground text-background'
                    : 'bg-background text-muted-foreground hover:bg-muted/40'
                  }`}
              >
                {p.value === 'high' ? (
                  <Zap className={`w-2.5 h-2.5 ${active ? 'text-white' : 'text-red-500'}`} />
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-background/60' : p.dot}`} />
                )}
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" onClick={save} disabled={!form.title.trim()} className="flex-1 h-7 text-xs">
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={cancel} className="flex-1 h-7 text-xs">
            Cancel
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`mb-2 group relative cursor-grab active:cursor-grabbing border-border
        ${isDragging
          ? 'rotate-1 opacity-90 border-primary/40'
          : 'hover:border-primary/30'
        }`}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          className="absolute top-2 right-2 h-11 w-11 rounded-xl inline-flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground z-10 focus-visible:ring-2 focus-visible:ring-primary"
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
      <div className="p-3 space-y-2">
        <p className="font-medium text-sm leading-tight line-clamp-2 pr-6">{task.title}</p>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}
        {(task.priority === 'high' || task.project || (task.totalWork && ['in_progress','in_review','completed'].includes(task.status))) && (
          <div className="flex gap-1.5 flex-wrap pt-1">
            {task.priority === 'high' && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium">
                <span className="w-1 h-1 rounded-full bg-red-500" />
                High Priority
              </span>
            )}
            {task.project && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                <Folder className="w-3 h-3 shrink-0" />
                {task.project}
              </span>
            )}
            {task.totalWork && ['in_progress','in_review','completed'].includes(task.status) && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                <Clock className="w-3 h-3 shrink-0" />
                {task.totalWork >= 60
                  ? `${Math.floor(task.totalWork / 60)}h ${task.totalWork % 60 > 0 ? `${task.totalWork % 60}m` : ''}`.trim()
                  : `${task.totalWork}m`}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
