import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function runMigrations(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log('🔄 Starting migrations...\n');

    // Create migrations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get executed migrations
    const { rows: executed } = await client.query('SELECT name FROM _migrations');
    const executedNames = new Set(executed.map((r) => r.name));

    // When compiled: dist/scripts/migrate.js → ../../migrations = project_root/migrations
    const migrationsDir = path.join(__dirname, '..', '..', 'migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.log('📁 No migrations directory found at:', migrationsDir);
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('📭 No migration files found.\n');
      return;
    }

    let migratedCount = 0;

    // Run pending migrations
    for (const file of files) {
      if (executedNames.has(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`🚀 Running ${file}...`);

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ ${file} completed`);
        migratedCount++;
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ ${file} failed:`, error);
        throw error;
      }
    }

    console.log(`\n✅ Migrations completed. ${migratedCount} new migration(s) applied.`);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
