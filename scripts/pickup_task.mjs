#!/usr/bin/env node
/**
 * pickup_task.mjs
 * Mineral Agent — find one "ready_to_start" task, estimate work time,
 * write total_work (minutes), move to "in_progress", log result.
 * Branch naming convention for coding agents: hermes/coder-work-{slugified-title}-{4-char-random-id}.
 *
 * Handles back_to_ready_reason:
 * - conflict_when_merge_to_main → auto-resolve conflicts, recreate PR, move to in_review
 * - manual_review_failed / other → leave in not_started, notify Discord, skip
 *
 * Usage: node pickup_task.mjs
 * Requires: DATABASE_URL env var (Neon PostgreSQL connection string)
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { existsSync } from 'fs';
import { mkdirSync } from 'fs';
import { appendFileSync } from 'fs';
import { execSync } from 'child_process';
const { Pool } = pg;

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_READY = 'ready_to_start';
const STATUS_IN_PROGRESS = 'in_progress';
const STATUS_IN_REVIEW = 'in_review';
const STATUS_NOT_STARTED = 'not_started';

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

// ─── Log ─────────────────────────────────────────────────────────────────────

const LOG_FILE = '/Users/andy/Project/mineral-agent/logs/pickup.log';

function log(message) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${message}\n`;
  try {
    mkdirSync('/Users/andy/Project/mineral-agent/logs', { recursive: true });
    appendFileSync(LOG_FILE, line);
  } catch { /* ignore */ }
  console.log(message);
}

// ─── Discord ─────────────────────────────────────────────────────────────────

async function discordNotify(message) {
  if (!process.env.DISCORD_WEBHOOK_URL) return;
  try {
    await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });
  } catch (err) {
    console.error('[discord] notification failed:', err.message);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBranchName(title = '') {
  const randomId = Math.random().toString(16).slice(2, 6).padStart(4, '0');
  const stopwords = new Set([
    'a', 'the', 'to', 'of', 'for', 'in', 'on', 'and', 'or', 'is', 'are', 'be',
    'add', 'the', 'to', 'of', 'for', 'and', 'or', 'is', 'are', 'be',
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

  const ordered = meaningfulWords
    .map((word, index) => ({ word, index, score: preferredTerms.has(word) ? 1 : 0 }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 2)
    .map(({ word }) => word);

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

function estimateWorkMinutes(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();
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
  return 60;
}

// ─── GitHub helpers ──────────────────────────────────────────────────────────

function getGhToken() {
  return execSync('gh auth token', { encoding: 'utf8' }).trim();
}

function getRepoLocalPath(project) {
  if (!project) return null;
  // mineral-dev/repo → /Users/andy/Project/mineral-dev/repo
  if (project.includes('/')) {
    const [org, repo] = project.split('/');
    return `/Users/andy/Project/mineral-dev/${repo}`;
  }
  return `/Users/andy/Project/${project}`;
}

async function resolveConflictAndRecreatePR(task, pool) {
  const { id, title, project, pr_url, back_to_ready_note } = task;
  const localPath = getRepoLocalPath(project);

  if (!localPath || !existsSync(localPath)) {
    throw new Error(`Local repo not found at ${localPath}`);
  }

  // Extract branch name from pr_url
  const prNumber = pr_url?.split('/').pop();
  if (!prNumber) throw new Error('No PR URL to extract branch from');

  // Get the branch name from the PR
  const token = getGhToken();
  let branchName;
  try {
    const res = await fetch(
      `https://api.github.com/repos/${project}/pulls/${prNumber}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' } }
    );
    if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
    const pr = await res.json();
    branchName = pr.head?.ref;
    if (!branchName) throw new Error('Could not determine branch name from PR');
  } catch (err) {
    throw new Error(`Failed to fetch PR branch name: ${err.message}`);
  }

  log(`[conflict] Resolving conflicts for task #${id} on branch ${branchName}`);

  // 1. Close the old PR
  try {
    await fetch(
      `https://api.github.com/repos/${project}/pulls/${prNumber}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/vnd.github.v3+json' },
        body: JSON.stringify({ state: 'closed' }),
      }
    );
    log(`[conflict] Closed old PR #${prNumber}`);
  } catch (err) {
    log(`[conflict] Warning: could not close old PR: ${err.message}`);
  }

  // 2. Rebase onto latest main
  try {
    execSync('git checkout main', { cwd: localPath });
    execSync('git pull origin main', { cwd: localPath });
    execSync(`git checkout ${branchName}`, { cwd: localPath });
    execSync('git rebase main', { cwd: localPath });
    log(`[conflict] Rebased ${branchName} onto main`);
  } catch (err) {
    // Rebase conflicts — use -X ours to prefer main's version for auth conflicts
    log(`[conflict] Rebase had conflicts, trying -X ours strategy`);
    try {
      execSync('git rebase --abort', { cwd: localPath });
      execSync(`git rebase -X ours main`, { cwd: localPath });
      log(`[conflict] Rebase succeeded with -X ours`);
    } catch (rebErr) {
      throw new Error(`Rebase failed: ${rebErr.message}`);
    }
  }

  // 3. Force push the rebased branch
  try {
    execSync(`git push --force-with-lease origin ${branchName}`, { cwd: localPath });
    log(`[conflict] Force-pushed rebased branch`);
  } catch (err) {
    throw new Error(`Force-push failed: ${err.message}`);
  }

  // 4. Create new PR
  let newPrUrl;
  try {
    const body = back_to_ready_note
      ? `Task #${id}: ${title}\n\nConflicts resolved automatically. Note: ${back_to_ready_note}`
      : `Task #${id}: ${title}\n\nConflicts resolved automatically. Please review and merge.`;
    const headBranch = branchName;
    newPrUrl = execSync(
      `gh pr create --repo ${project} --head ${headBranch} --title "Hermes: ${title}" --body "${body}" --base main`,
      { cwd: localPath, encoding: 'utf8' }
    ).trim();
    log(`[conflict] Created new PR: ${newPrUrl}`);
  } catch (err) {
    throw new Error(`Failed to create new PR: ${err.message}`);
  }

  // 5. Clear back_to_ready_reason and back_to_ready_note
  await query(
    `UPDATE tasks SET back_to_ready_reason = NULL, back_to_ready_note = NULL, updated_at = NOW() WHERE id = $1`,
    [id]
  );

  // 6. Move to in_review
  await query(
    `UPDATE tasks SET status = $1, pr_url = $2, updated_at = NOW() WHERE id = $3`,
    [STATUS_IN_REVIEW, newPrUrl, id]
  );

  log(`[conflict] Task #${id} moved to in_review with new PR`);
  return newPrUrl;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Find one ready_to_start task
  const result = await query(
    `SELECT id, title, description, priority, project, total_work, pr_url, back_to_ready_reason, back_to_ready_note
     FROM tasks
     WHERE status = $1
     ORDER BY
       CASE priority WHEN 'high' THEN 0 ELSE 1 END,
       COALESCE(total_work, 999999) ASC,
       created_at ASC
     LIMIT 1`,
    [STATUS_READY]
  );

  if (result.rows.length === 0) {
    log(`[mineral-agent] No tasks in "${STATUS_READY}" — nothing to pick up.`);
    return;
  }

  const task = result.rows[0];

  // ── Handle back_to_ready_reason ────────────────────────────────────────────

  if (task.back_to_ready_reason === 'conflict_when_merge_to_main') {
    // Auto-resolve conflicts and recreate PR
    try {
      if (!task.pr_url) {
        log(`[conflict] Task #${task.id} has conflict reason but no PR URL — treating as manual_review_failed`);
        await query(
          `UPDATE tasks SET back_to_ready_reason = 'manual_review_failed', status = $1, back_to_ready_reason = 'manual_review_failed', updated_at = NOW() WHERE id = $2`,
          [STATUS_NOT_STARTED, task.id]
        );
        await discordNotify(`🔴 Task #${task.id}: "${task.title}" returned with conflicts but no PR — needs manual re-queue`);
        return;
      }

      const newPrUrl = await resolveConflictAndRecreatePR(task, pool);
      await discordNotify(`🔄 Conflicts auto-resolved for task #${task.id}: "${task.title}" — new PR: ${newPrUrl} → in_review`);
      log(`[mineral-agent] Completed conflict resolution for task #${task.id} — new PR: ${newPrUrl}`);
      return;
    } catch (err) {
      log(`[conflict] Failed to resolve conflicts for task #${task.id}: ${err.message}`);
      await discordNotify(`❌ Conflict resolution failed for task #${task.id}: "${task.title}" — ${err.message}`);
      return;
    }
  }

  if (task.back_to_ready_reason === 'manual_review_failed') {
    log(`[mineral-agent] Task #${task.id} ("${task.title}") has back_to_ready_reason=manual_review_failed — moving to not_started and skipping.`);
    await query(
      `UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2`,
      [STATUS_NOT_STARTED, task.id]
    );
    await discordNotify(`🔴 Review failed — task #${task.id}: "${task.title}" moved to not_started, needs manual re-queue`);
    return;
  }

  if (task.back_to_ready_reason === 'other') {
    log(`[mineral-agent] Task #${task.id} ("${task.title}") has back_to_ready_reason=other — moving to not_started and skipping.`);
    const note = task.back_to_ready_note ? `: ${task.back_to_ready_note}` : '';
    await query(
      `UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2`,
      [STATUS_NOT_STARTED, task.id]
    );
    await discordNotify(`⚠️ Task #${task.id}: "${task.title}"${note} — moved to not_started, needs manual re-queue`);
    return;
  }

  // ── Normal pickup flow ──────────────────────────────────────────────────────

  const estimatedMinutes = estimateWorkMinutes(task.title, task.description);

  await query(
    `UPDATE tasks SET status = $1, total_work = $2, updated_at = NOW() WHERE id = $3`,
    [STATUS_IN_PROGRESS, estimatedMinutes, task.id]
  );

  const summary = `[mineral-agent] Picked up task #${task.id} — "${task.title}" — estimated ${formatDuration(estimatedMinutes)}`;
  log(summary);

  await discordNotify(`🔵 Starting: ${task.title} — moving to in_progress`);
}

main().catch((err) => {
  log(`[mineral-agent] Error: ${err.message}`);
  process.exit(1);
});
