import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'tasks.json');

// Ensure data dir exists
const DATA_DIR = path.dirname(DATA_FILE);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readTasks() {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  if (!raw.trim()) {
    return [];
  }
  return JSON.parse(raw);
}

function writeTasks(tasks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

export function getAll() {
  return readTasks().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function create(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Task data is required');
  }

  const title = typeof data.title === 'string' ? data.title.trim() : '';
  if (!title) {
    throw new Error('Task title is required');
  }

  const tasks = readTasks();
  const maxId = tasks.reduce((max, t) => Math.max(max, t.id || 0), 0);
  const task = {
    id: maxId + 1,
    title,
    description: typeof data.description === 'string' && data.description.trim()
      ? data.description.trim()
      : null,
    priority: data.priority || 'normal',
    project: typeof data.project === 'string' && data.project.trim()
      ? data.project.trim()
      : null,
    status: data.status || 'not_started',
    order: typeof data.order === 'number' ? data.order : 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tasks.push(task);
  writeTasks(tasks);
  return task;
}

export function update(id, data) {
  const tasks = readTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) throw new Error('Task not found');
  tasks[idx] = { ...tasks[idx], ...data, updatedAt: new Date().toISOString() };
  writeTasks(tasks);
  return tasks[idx];
}

export function remove(id) {
  const tasks = readTasks();
  const filtered = tasks.filter(t => t.id !== id);
  writeTasks(filtered);
}
