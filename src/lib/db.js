import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const DATA_FILE = '/Users/andy/Project/mineral-agent/frontend/data/tasks.json';

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
  return JSON.parse(raw);
}

function writeTasks(tasks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

export function getAll() {
  return readTasks().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function create(data) {
  const tasks = readTasks();
  const maxId = tasks.reduce((max, t) => Math.max(max, t.id || 0), 0);
  const task = {
    id: maxId + 1,
    title: data.title,
    description: data.description || null,
    priority: data.priority || 'normal',
    project: data.project || null,
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
  console.error('DEBUG update: id=', id, 'type=', typeof id, 'tasks=', JSON.stringify(tasks.map(t=>({id:t.id,type:typeof t.id}))));
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
