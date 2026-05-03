export const TASK_STATUSES = [
  'not_started',
  'ready_to_start',
  'in_progress',
  'in_review',
  'completed',
];

export const TASK_COLUMNS = [
  { id: 'not_started', label: 'To Do', dotColor: 'bg-neutral-400', borderColor: 'border-l-neutral-400' },
  { id: 'ready_to_start', label: 'Ready', dotColor: 'bg-blue-500', borderColor: 'border-l-blue-500' },
  { id: 'in_progress', label: 'In Progress', dotColor: 'bg-amber-500', borderColor: 'border-l-amber-500' },
  { id: 'in_review', label: 'In Review', dotColor: 'bg-purple-500', borderColor: 'border-l-purple-500' },
  { id: 'completed', label: 'Completed', dotColor: 'bg-emerald-600', borderColor: 'border-l-emerald-600' },
];

export const TASK_PRIORITIES = [
  { value: 'normal', label: 'Normal', dot: 'bg-muted-foreground/50' },
  { value: 'high', label: 'High', dot: 'bg-red-500' },
];

export const TASK_STATUS_LABELS = {
  not_started: 'Not started',
  ready_to_start: 'Ready to start',
  in_progress: 'In progress',
  in_review: 'In review',
  completed: 'Completed',
};

export const TASK_STATUS_HELP = {
  not_started: {
    emptyTitle: 'No tasks queued',
    emptyCopy: 'Add a task to queue it for the agent.',
  },
  ready_to_start: {
    emptyTitle: 'Nothing ready yet',
    emptyCopy: 'Drop a queued task here when it is ready to start.',
  },
  in_progress: {
    emptyTitle: 'No work in progress',
    emptyCopy: 'Tasks actively being worked on appear here.',
  },
  in_review: {
    emptyTitle: 'No tasks in review',
    emptyCopy: 'Items waiting for review appear here.',
  },
  completed: {
    emptyTitle: 'No completed tasks',
    emptyCopy: 'Finished tasks appear here.',
  },
};

export function normalizeStatus(status) {
  if (TASK_STATUSES.includes(status)) return status;
  return 'not_started';
}

export function normalizeTaskValue(value) {
  if (value === undefined || value === null || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function formatWorkEstimate(minutes) {
  const value = normalizeTaskValue(minutes);
  if (value === null) return '—';
  if (value >= 60) {
    const hours = Math.floor(value / 60);
    const mins = value % 60;
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
  }
  return `${value}m`;
}

export function formatTaskDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function normalizeTaskRecord(row) {
  const estimatedWork = normalizeTaskValue(row.estimated_work ?? row.total_work);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority || 'normal',
    project: row.project,
    status: normalizeStatus(row.status),
    order: row.task_order ?? 0,
    estimatedWork,
    totalWork: estimatedWork,
    prUrl: row.pr_url,
    completedAt: row.completed_at,
    backToReadyReason: row.back_to_ready_reason,
    backToReadyNote: row.back_to_ready_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
