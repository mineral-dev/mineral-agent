'use client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

const priorityColors = { high: 'bg-red-100 text-red-700 border-red-200', normal: 'bg-blue-100 text-blue-700 border-blue-200' };

export function TaskCard({ task, onUpdate, onDelete, isDragging }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: task.title, description: task.description || '' });

  const save = () => {
    onUpdate(task.id, form);
    setEditing(false);
  };

  return (
    <Card className={`mb-2 cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-xl ring-2 ring-primary' : 'shadow-sm hover:shadow-md'} transition-all`}>
      <CardHeader className="p-3 pb-1">
        <div className="flex items-start justify-between gap-2">
          {editing ? (
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="font-semibold" autoFocus onKeyDown={e => e.key === 'Enter' && save()} />
          ) : (
            <button onClick={() => setExpanded(x => !x)} className="flex items-center gap-1 text-left flex-1">
              {expanded ? <ChevronDown className="w-4 h-4 shrink-0 mt-0.5" /> : <ChevronRight className="w-4 h-4 shrink-0 mt-0.5" />}
              <CardTitle className="text-sm font-semibold leading-tight">{task.title}</CardTitle>
            </button>
          )}
          <Button variant="ghost" size="icon" className="w-6 h-6 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => onDelete(task.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="flex gap-1.5 mt-1.5 flex-wrap">
          <Badge variant="outline" className={`text-xs ${priorityColors[task.priority] || priorityColors.normal}`}>{task.priority}</Badge>
          {task.project && <Badge variant="outline" className="text-xs bg-muted/50">{task.project}</Badge>}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-3 pt-1 space-y-3">
          {editing ? (
            <>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description (optional)" rows={3} className="text-sm" />
              <div className="flex gap-2">
                <Button size="sm" onClick={save}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => { setEditing(false); setForm({ title: task.title, description: task.description || '' }); }}>Cancel</Button>
              </div>
            </>
          ) : (
            <>
              {task.description && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{task.description}</p>}
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setEditing(true)}>Edit</Button>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
