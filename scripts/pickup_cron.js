const fs = require('fs');
const { Client } = require('pg');

const lines = fs.readFileSync('/Users/andy/Project/mineral-agent/.env.local', 'utf8').split('\n');
const dbUrl = lines.find(l => l.startsWith('DATABASE_URL='))?.split('=').slice(1).join('=');

const connectionString = dbUrl + '?sslmode=require';
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();
  
  // Find next ready_to_start task
  const result = await client.query(`
    SELECT id, title, description, priority, project, total_work, created_at
    FROM tasks
    WHERE status = 'ready_to_start'
    ORDER BY
      CASE WHEN priority = 'high' THEN 0 ELSE 1 END,
      COALESCE(total_work, 999999) ASC,
      created_at ASC
    LIMIT 1
  `);
  
  if (result.rows.length === 0) {
    console.log('NO_TASKS');
    await client.end();
    process.exit(0);
  }
  
  const task = result.rows[0];
  console.log('FOUND_TASK:', JSON.stringify(task));
  
  await client.end();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
