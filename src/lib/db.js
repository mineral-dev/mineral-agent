import pg from 'pg';
import {
  TASK_STATUSES,
  normalizeStatus,
  normalizeTaskRecord,
  normalizeTaskValue,
} from './tasks';

const { Pool } = pg;

const TASK_SELECT = `
  SELECT
    id,
    title,
    description,
    priority,
    project,
    status,
    task_order,
    COALESCE(estimated_work, total_work) AS estimated_work,
    total_work,
    pr_url,
    completed_at::text AS completed_at,
    back_to_ready_reason,
    back_to_ready_note,
    created_at::text AS created_at,
    updated_at::text AS updated_at
  FROM tasks
`;

const TASK_ORDER_BY = `
  ORDER BY
    CASE status
      WHEN 'not_started' THEN 0
      WHEN 'ready_to_start' THEN 1
      WHEN 'in_progress' THEN 2
      WHEN 'in_review' THEN 3
      WHEN 'completed' THEN 4
      ELSE 5
    END,
    task_order ASC,
    id ASC
`;

const TASK_STATUS_SET = new Set(TASK_STATUSES);

let pool;
let schemaInitialized = false;

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
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

async function withClient(fn) {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

function normalizeNullableText(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeBackToReadyReason(value) {
  if (value == null) return null;
  const normalized = String(value);
  return ['conflict_when_merge_to_main', 'manual_review_failed', 'other'].includes(normalized)
    ? normalized
    : null;
}

async function initSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id              SERIAL PRIMARY KEY,
      title           TEXT NOT NULL,
      description     TEXT,
      priority        TEXT NOT NULL DEFAULT 'normal',
      project         TEXT,
      status          TEXT NOT NULL DEFAULT 'not_started',
      task_order      INTEGER NOT NULL DEFAULT 0,
      total_work      INTEGER,
      estimated_work  INTEGER,
      pr_url          TEXT,
      completed_at    TIMESTAMPTZ,
      back_to_ready_reason TEXT,
      back_to_ready_note   TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS total_work INTEGER`);
  await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_work INTEGER`);
  await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS pr_url TEXT`);
  await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ`);
  await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS back_to_ready_reason TEXT`);
  await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS back_to_ready_note TEXT`);
  await client.query(`
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_order INTEGER NOT NULL DEFAULT 0
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  await client.query(`
    INSERT INTO settings (key, value)
    VALUES ('password', 'admin1')
    ON CONFLICT (key) DO NOTHING
  `);
}

async function backfillLegacyRows(client) {
  await client.query(`
    UPDATE tasks
    SET status = 'completed',
        completed_at = COALESCE(completed_at, updated_at, NOW())
    WHERE status = 'approved'
  `);

  await client.query(`
    UPDATE tasks
    SET status = 'not_started'
    WHERE status IS NULL
       OR status NOT IN ('not_started', 'ready_to_start', 'in_progress', 'in_review', 'completed')
  `);

  await client.query(`
    UPDATE tasks
    SET estimated_work = total_work
    WHERE estimated_work IS NULL AND total_work IS NOT NULL
  `);

  await client.query(`
    UPDATE tasks
    SET completed_at = COALESCE(completed_at, updated_at, NOW())
    WHERE status = 'completed' AND completed_at IS NULL
  `);

  await client.query(`
    UPDATE tasks
    SET task_order = 0
    WHERE task_order IS NULL
  `);
}

async function ensureSchema() {
  if (schemaInitialized) return;
  await withClient(async (client) => {
    await client.query('BEGIN');
    try {
      await initSchema(client);
      await backfillLegacyRows(client);
      await client.query('COMMIT');
      schemaInitialized = true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

function normalizeTaskInput(data = {}) {
  const estimatedWork = normalizeTaskValue(data.estimatedWork ?? data.totalWork);
  return {
    title: typeof data.title === 'string' ? data.title.trim() : '',
    description: normalizeNullableText(data.description),
    priority: typeof data.priority === 'string' && data.priority.trim()
      ? data.priority.trim()
      : 'normal',
    project: normalizeNullableText(data.project),
    status: normalizeStatus(data.status),
    order: normalizeTaskValue(data.order),
    estimatedWork,
    totalWork: estimatedWork,
    prUrl: normalizeNullableText(data.prUrl),
    completedAt: data.completedAt === undefined ? undefined : normalizeNullableText(data.completedAt),
    backToReadyReason: normalizeBackToReadyReason(data.backToReadyReason),
    backToReadyNote: normalizeNullableText(data.backToReadyNote),
  };
}

function isCompleted(status) {
  return status === 'completed';
}

function toClientTask(row) {
  return normalizeTaskRecord(row);
}

async function fetchTasks(client, where = '', params = []) {
  const result = await client.query(`
    ${TASK_SELECT}
    ${where}
    ${TASK_ORDER_BY}
  `, params);
  return result.rows.map(toClientTask);
}

async function fetchTaskById(client, id) {
  const result = await client.query(
    `
      ${TASK_SELECT}
      WHERE id = $1
      LIMIT 1
    `,
    [Number(id)]
  );
  return result.rows[0] ? toClientTask(result.rows[0]) : null;
}

async function reindexTasks(client, tasks, status) {
  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index];
    await client.query(
      `
        UPDATE tasks
        SET status = $1,
            task_order = $2,
            updated_at = NOW()
        WHERE id = $3
      `,
      [status, index, task.id]
    );
  }
}

async function loadOrderedTasksForStatus(client, status) {
  const result = await client.query(
    `
      ${TASK_SELECT}
      WHERE status = $1
      ORDER BY task_order ASC, id ASC
      FOR UPDATE
    `,
    [status]
  );
  return result.rows.map(toClientTask);
}

export async function getAll() {
  await ensureSchema();
  return withClient((client) => fetchTasks(client));
}

export async function getById(id) {
  await ensureSchema();
  return withClient((client) => fetchTaskById(client, id));
}

export async function create(data) {
  await ensureSchema();
  const payload = normalizeTaskInput(data);
  if (!payload.title) throw new Error('Task title is required');

  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      const nextOrderResult = await client.query(
        `
          SELECT COALESCE(MAX(task_order), -1) + 1 AS next_order
          FROM tasks
          WHERE status = $1
        `,
        [payload.status]
      );
      const nextOrder = payload.order != null ? payload.order : nextOrderResult.rows[0].next_order;
      const completedAt = payload.completedAt !== undefined
        ? payload.completedAt
        : (isCompleted(payload.status) ? new Date().toISOString() : null);
      const result = await client.query(
        `
          INSERT INTO tasks (
            title,
            description,
            priority,
            project,
            status,
            task_order,
            total_work,
            estimated_work,
            pr_url,
            completed_at,
            back_to_ready_reason,
            back_to_ready_note
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING
            id,
            title,
            description,
            priority,
            project,
            status,
            task_order,
            total_work,
            estimated_work,
            pr_url,
            completed_at::text AS completed_at,
            back_to_ready_reason,
            back_to_ready_note,
            created_at::text AS created_at,
            updated_at::text AS updated_at
        `,
        [
          payload.title,
          payload.description,
          payload.priority,
          payload.project,
          payload.status,
          nextOrder,
          payload.totalWork,
          payload.estimatedWork,
          payload.prUrl,
          completedAt,
          payload.backToReadyReason,
          payload.backToReadyNote,
        ]
      );
      await client.query('COMMIT');
      return toClientTask(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

export async function update(id, data) {
  await ensureSchema();
  const payload = normalizeTaskInput(data);

  return withClient(async (client) => {
    const existing = await fetchTaskById(client, id);
    if (!existing) throw new Error('Task not found');

    const title = payload.title || existing.title;
    const description = data.description !== undefined
      ? payload.description
      : existing.description;
    const priority = data.priority !== undefined ? payload.priority : existing.priority;
    const project = data.project !== undefined ? payload.project : existing.project;
    const status = data.status !== undefined ? payload.status : existing.status;
    const order = data.order !== undefined ? payload.order : existing.order;
    const estimatedWork = data.estimatedWork !== undefined || data.totalWork !== undefined
      ? payload.estimatedWork
      : existing.estimatedWork;
    const prUrl = data.prUrl !== undefined ? payload.prUrl : existing.prUrl;
    const completedAt = data.completedAt !== undefined
      ? payload.completedAt
      : (isCompleted(status)
        ? (existing.completedAt || new Date().toISOString())
        : (data.status !== undefined ? null : existing.completedAt));
    const backToReadyReason = data.backToReadyReason !== undefined
      ? payload.backToReadyReason
      : existing.backToReadyReason;
    const backToReadyNote = data.backToReadyNote !== undefined
      ? payload.backToReadyNote
      : existing.backToReadyNote;

    const result = await client.query(
      `
        UPDATE tasks
        SET title = $1,
            description = $2,
            priority = $3,
            project = $4,
            status = $5,
            task_order = $6,
            total_work = $7,
            estimated_work = $8,
            pr_url = $9,
            completed_at = $10,
            back_to_ready_reason = $11,
            back_to_ready_note = $12,
            updated_at = NOW()
        WHERE id = $13
        RETURNING
          id,
          title,
          description,
          priority,
          project,
          status,
          task_order,
          total_work,
          estimated_work,
          pr_url,
          completed_at::text AS completed_at,
          back_to_ready_reason,
          back_to_ready_note,
          created_at::text AS created_at,
          updated_at::text AS updated_at
      `,
      [
        title,
        description,
        priority,
        project,
        status,
        order,
        estimatedWork,
        estimatedWork,
        prUrl,
        completedAt,
        backToReadyReason,
        backToReadyNote,
        Number(id),
      ]
    );

    return toClientTask(result.rows[0]);
  });
}

const PRIORITY_ESTIMATE_MINUTES = { high: 30, normal: 60, low: 120 };

export async function move(id, data) {
  await ensureSchema();
  const payload = normalizeTaskInput(data);
  const reasonProvided = Object.prototype.hasOwnProperty.call(data || {}, 'backToReadyReason');
  const noteProvided = Object.prototype.hasOwnProperty.call(data || {}, 'backToReadyNote');

  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      const currentResult = await client.query(
        `
          ${TASK_SELECT}
          WHERE id = $1
          FOR UPDATE
        `,
        [Number(id)]
      );

      if (currentResult.rows.length === 0) {
        throw new Error('Task not found');
      }

      const current = toClientTask(currentResult.rows[0]);
      const sourceStatus = current.status;
      const targetStatus = data.status !== undefined ? payload.status : current.status;
      const targetOrder = payload.order == null ? current.order : payload.order;
      const nextEstimatedWork = (() => {
        if (payload.estimatedWork != null) return payload.estimatedWork;
        if (current.estimatedWork != null) return current.estimatedWork;
        if (targetStatus === 'in_progress') {
          return PRIORITY_ESTIMATE_MINUTES[current.priority] ?? PRIORITY_ESTIMATE_MINUTES.normal;
        }
        return null;
      })();
      const nextCompletedAt = payload.completedAt !== undefined
        ? payload.completedAt
        : (isCompleted(targetStatus)
          ? (current.completedAt || new Date().toISOString())
          : null);
      const nextReason = reasonProvided ? payload.backToReadyReason : current.backToReadyReason;
      const nextNote = noteProvided ? payload.backToReadyNote : current.backToReadyNote;

      const sourceTasks = await loadOrderedTasksForStatus(client, sourceStatus);
      const sourceWithoutCurrent = sourceTasks.filter((task) => task.id !== current.id);

      let destinationTasks;
      if (sourceStatus === targetStatus) {
        const clampedOrder = Math.max(0, Math.min(targetOrder, sourceWithoutCurrent.length));
        sourceWithoutCurrent.splice(clampedOrder, 0, {
          ...current,
          status: targetStatus,
          order: clampedOrder,
          estimatedWork: nextEstimatedWork,
          totalWork: nextEstimatedWork,
          completedAt: nextCompletedAt,
          backToReadyReason: nextReason,
          backToReadyNote: nextNote,
        });
        destinationTasks = sourceWithoutCurrent;
        await reindexTasks(client, destinationTasks, targetStatus);
      } else {
        const destinationSource = await loadOrderedTasksForStatus(client, targetStatus);
        const destinationWithoutCurrent = destinationSource.slice();
        const clampedOrder = Math.max(0, Math.min(targetOrder, destinationWithoutCurrent.length));
        destinationWithoutCurrent.splice(clampedOrder, 0, {
          ...current,
          status: targetStatus,
          order: clampedOrder,
          estimatedWork: nextEstimatedWork,
          totalWork: nextEstimatedWork,
          completedAt: nextCompletedAt,
          backToReadyReason: nextReason,
          backToReadyNote: nextNote,
        });

        await reindexTasks(client, sourceWithoutCurrent, sourceStatus);
        await reindexTasks(client, destinationWithoutCurrent, targetStatus);
        destinationTasks = destinationWithoutCurrent;
      }

      await client.query(
        `
          UPDATE tasks
          SET title = $1,
              description = $2,
              priority = $3,
              project = $4,
              status = $5,
              task_order = $6,
              total_work = $7,
              estimated_work = $8,
              pr_url = $9,
              completed_at = $10,
              back_to_ready_reason = $11,
              back_to_ready_note = $12,
              updated_at = NOW()
          WHERE id = $13
        `,
        [
          current.title,
          current.description,
          current.priority,
          current.project,
          targetStatus,
          Math.max(0, Math.min(targetOrder, destinationTasks.length - 1)),
          nextEstimatedWork,
          nextEstimatedWork,
          current.prUrl,
          nextCompletedAt,
          nextReason,
          nextNote,
          current.id,
        ]
      );

      const tasks = await fetchTasks(client);
      const updatedTask = tasks.find((task) => task.id === current.id) || null;
      await client.query('COMMIT');
      return { task: updatedTask, tasks };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

export async function remove(id) {
  await ensureSchema();
  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      const existingResult = await client.query(
        `
          ${TASK_SELECT}
          WHERE id = $1
          FOR UPDATE
        `,
        [Number(id)]
      );
      if (existingResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return;
      }

      const existing = toClientTask(existingResult.rows[0]);
      await client.query('DELETE FROM tasks WHERE id = $1', [existing.id]);
      const remaining = await loadOrderedTasksForStatus(client, existing.status);
      await reindexTasks(client, remaining, existing.status);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

export async function getByStatus(status) {
  await ensureSchema();
  const normalizedStatus = TASK_STATUS_SET.has(status) ? status : 'not_started';
  return withClient((client) =>
    fetchTasks(
      client,
      'WHERE status = $1',
      [normalizedStatus]
    )
  );
}

export async function getSetting(key) {
  await ensureSchema();
  const result = await query('SELECT value FROM settings WHERE key = $1', [key]);
  return result.rows.length > 0 ? result.rows[0].value : null;
}

export async function setSetting(key, value) {
  await ensureSchema();
  await query(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
    [key, value]
  );
}
