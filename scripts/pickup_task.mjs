#!/usr/bin/env node
/**
 * pickup_task.mjs
 * Mineral Agent — find one "ready_to_start" task, estimate work time,
 * write total_work (minutes), move to "in_progress", log result.
 * Branch naming convention for coding agents: hermes/coder-work-{slugified-title}-{4-char-random-id}.
 *
 * Usage: node pickup_task.mjs
 * Requires: DATABASE_URL env var (Neon PostgreSQL connection string)
 */

import pg from 'pg';
const { Pool } = pg;

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_READY = 'ready_to_start';
const STATUS_IN_PROGRESS = 'in_progress';

// ─── DB ──────────────────────────────────────────────────────────────────────

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

// ─── Estimation ───────────────────────────────────────────────────────────────

/**
 * Estimate work time in minutes based on title + description content.
 * Returns an integer between 15 and 480.
 */
function estimateWorkMinutes(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();

  // High-confidence keywords
  if (/migrate|upgrade|port |rebuild|re-architect/.test(text)) return 240 + Math.floor(Math.random() * 120);
  if (/full[- ]?stack|multi[- ]?page|dashboard| redesign|rewrite/.test(text)) return 180 + Math.floor(Math.random() * 120);
  if (/api|endpoint|integration|webhook|oauth|auth/.test(text)) return 90 + Math.floor(Math.random() * 90);
  if (/database|schema|migration|prisma|sql/.test(text)) return 60 + Math.floor(Math.random() * 60);
  if (/test|spec|e2e|unit test|coverage/.test(text)) return 45 + Math.floor(Math.random() * 45);
  if (/refactor|cleanup|optimize|performance|cache/.test(text)) return 60 + Math.floor(Math.random() * 60);
  if (/feature|implement|add |new |build |create /.test(text)) return 90 + Math.floor(Math.random() * 90);
  if (/bug|fix|hotfix|patch|issue|error|crash/.test(text)) return 30 + Math.floor(Math.random() * 60);
  if (/docs?|readme|comment|changelog|doc/.test(text)) return 15 + Math.floor(Math.random() * 30);
  if (/config|setup|init|env|deploy|vercel|cicd/.test(text)) return 15 + Math.floor(Math.random() * 45);

  // Default fallback
  return 60;
}

// ─── Format ───────────────────────────────────────────────────────────────────

function formatBranchName(title = '') {
  const randomId = Math.random().toString(16).slice(2, 6).padStart(4, '0');
  const stopwords = new Set([
    'a', 'the', 'to', 'of', 'for', 'in', 'on', 'and', 'or', 'is', 'are', 'be',
    'add', 'new', 'create', 'change', 'show', 'update', 'name', 'creation',
  ]);
  const preferredTerms = new Set(['branch']);

  const words = title
    .toLowerCase()
    .match(/[a-z0-9]+/g) ?? [];

  const meaningfulWords = [];
  const seen = new Set();
  for (const word of words) {
    if (stopwords.has(word) || seen.has(word)) continue;
    seen.add(word);
    meaningfulWords.push(word);
  }

  // Sort preferred terms first, then by original order; take first 2
  const ordered = meaningfulWords
    .map((word, index) => ({ word, index, score: preferredTerms.has(word) ? 1 : 0 }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 2)
    .map(({ word }) => word);

  // Build slug from meaningful words, truncate to 26 chars to keep total ≤ 50
  let slug = ordered.join('-');
  const maxTitleLen = 26;
  if (slug.length > maxTitleLen) slug = slug.slice(0, maxTitleLen);

  return `hermes/coder-work-${slug}-${randomId}`;
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── Log ─────────────────────────────────────────────────────────────────────

const LOG_FILE = '/Users/andy/Project/mineral-agent/logs/pickup.log';
const fs = await import('fs');

function log(message) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${message}\n`;
  try {
    fs.mkdirSync('/Users/andy/Project/mineral-agent/logs', { recursive: true });
    fs.appendFileSync(LOG_FILE, line);
  } catch { /* ignore */ }
  console.log(message);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Find one ready_to_start task
  const result = await query(
    `SELECT id, title, description, priority
     FROM tasks
     WHERE status = $1
     ORDER BY task_order ASC
     LIMIT 1`,
    [STATUS_READY]
  );

  if (result.rows.length === 0) {
    log(`[mineral-agent] No tasks in "${STATUS_READY}" — nothing to pick up.`);
    return;
  }

  const task = result.rows[0];
  const estimatedMinutes = estimateWorkMinutes(task.title, task.description);

  // 2. Update: write total_work + move to in_progress
  await query(
    `UPDATE tasks
     SET status = $1, total_work = $2, updated_at = NOW()
     WHERE id = $3`,
    [STATUS_IN_PROGRESS, estimatedMinutes, task.id]
  );

  const summary = `[mineral-agent] Picked up task #${task.id} — "${task.title}" — estimated ${formatDuration(estimatedMinutes)}`;
  log(summary);

  // 3. Notify via Discord webhook if configured
  if (process.env.DISCORD_WEBHOOK_URL) {
    try {
      const body = JSON.stringify({
        content: `📋 **Task picked up**\n**#${task.id}** — ${task.title}\n⏱️ Estimated: ${formatDuration(estimatedMinutes)}`,
      });
      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
    } catch (err) {
      console.error('[mineral-agent] Discord notification failed:', err.message);
    }
  }
}

main().catch((err) => {
  log(`[mineral-agent] Error: ${err.message}`);
  process.exit(1);
});
