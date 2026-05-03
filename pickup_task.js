const { Client } = require('pg');
const fs = require('fs');

const envContent = fs.readFileSync('/Users/andy/Project/mineral-agent/.env.local', 'utf8');
const databaseUrl = envContent.match(/DATABASE_URL=(.+)/)?.[1]?.trim();

if (!databaseUrl) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => client.query(`
    SELECT id, title, description, priority, project, total_work, created_at
    FROM tasks
    WHERE status = 'ready_to_start'
    ORDER BY
      CASE WHEN priority = 'high' THEN 0 ELSE 1 END,
      COALESCE(total_work, 999999) ASC,
      created_at ASC
    LIMIT 1
  `))
  .then(r => {
    console.log(JSON.stringify(r.rows, null, 2));
    client.end();
  })
  .catch(e => {
    console.error(e.message);
    process.exit(1);
  });
