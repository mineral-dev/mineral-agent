import pg from 'pg';
const { Pool } = pg;

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    pool = new Pool({ connectionString, max: 1 });
  }
  return pool;
}

async function query(sql, params) {
  const client = await getPool().connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}

// Initialize schema (called once on first request)
async function initSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          SERIAL PRIMARY KEY,
      title       TEXT    NOT NULL,
      description TEXT,
      priority    TEXT    NOT NULL DEFAULT 'normal',
      project     TEXT,
      status      TEXT    NOT NULL DEFAULT 'not_started',
      task_order  INTEGER NOT NULL DEFAULT 0,
      total_work  INTEGER,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ`);
}

// Ensure schema exists
let schemaInitialized = false;
async function ensureSchema() {
  if (!schemaInitialized) {
    await initSchema();
    schemaInitialized = true;
  }
}

export async function getAll() {
  await ensureSchema();
  const result = await query(
    'SELECT id, title, description, priority, project, status, task_order, total_work, created_at::text, updated_at::text, started_at::text FROM tasks ORDER BY task_order ASC'
  );
  return result.rows.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    project: row.project,
    status: row.status,
    order: row.task_order,
    totalWork: row.total_work,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at,
  }));
}

export async function getById(id) {
  await ensureSchema();
  const result = await query(
    'SELECT id, title, description, priority, project, status, task_order, total_work, created_at::text, updated_at::text, started_at::text FROM tasks WHERE id = $1',
    [Number(id)]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    project: row.project,
    status: row.status,
    order: row.task_order,
    totalWork: row.total_work,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at,
  };
}

export async function create(data) {
  await ensureSchema();
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  if (!title) throw new Error('Task title is required');

  const description = typeof data.description === 'string' && data.description.trim()
    ? data.description.trim() : null;
  const priority = data.priority || 'normal';
  const project = typeof data.project === 'string' && data.project.trim()
    ? data.project.trim() : null;
  const status = data.status || 'not_started';
  const order = typeof data.order === 'number' ? data.order : 0;
  const totalWork = typeof data.totalWork === 'number' ? data.totalWork : null;

  const result = await query(
    `INSERT INTO tasks (title, description, priority, project, status, task_order, total_work, started_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, title, description, priority, project, status, task_order, total_work, created_at::text, updated_at::text, started_at::text`,
    [title, description, priority, project, status, order, totalWork, status === 'in_progress' ? new Date() : null]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    project: row.project,
    status: row.status,
    order: row.task_order,
    totalWork: row.total_work,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at,
  };
}

export async function update(id, data) {
  await ensureSchema();
  const existing = await getById(id);
  if (!existing) throw new Error('Task not found');

  const title = typeof data.title === 'string' ? data.title.trim() : existing.title;
  const description = data.description !== undefined
    ? (typeof data.description === 'string' && data.description.trim() ? data.description.trim() : null)
    : existing.description;
  const priority = data.priority || existing.priority;
  const project = data.project !== undefined
    ? (typeof data.project === 'string' && data.project.trim() ? data.project.trim() : null)
    : existing.project;
  const status = data.status || existing.status;
  const order = data.order !== undefined ? data.order : existing.order;
  const totalWork = data.totalWork !== undefined ? data.totalWork : existing.totalWork;

  const result = await query(
    `UPDATE tasks SET title=$1, description=$2, priority=$3, project=$4, status=$5, task_order=$6, total_work=$7,
      started_at = CASE WHEN $5 = 'in_progress' AND started_at IS NULL THEN NOW() ELSE started_at END,
      updated_at = NOW()
     WHERE id=$8
     RETURNING id, title, description, priority, project, status, task_order, total_work, created_at::text, updated_at::text, started_at::text`,
    [title, description, priority, project, status, order, totalWork, Number(id)]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    project: row.project,
    status: row.status,
    order: row.task_order,
    totalWork: row.total_work,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at,
  };
}

export async function remove(id) {
  await ensureSchema();
  await query('DELETE FROM tasks WHERE id = $1', [Number(id)]);
}

export async function getByStatus(status) {
  await ensureSchema();
  const result = await query(
    'SELECT id, title, description, priority, project, status, task_order, total_work, created_at::text, updated_at::text, started_at::text FROM tasks WHERE status = $1 ORDER BY task_order ASC',
    [status]
  );
  return result.rows.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    project: row.project,
    status: row.status,
    order: row.task_order,
    totalWork: row.total_work,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at,
  }));
}
