/**
 * @fileoverview Database setup script.
 *
 * Connects to the `dayflow` PostgreSQL database and runs the schema.sql file.
 * This is safe to run multiple times — the schema uses DROP IF EXISTS so
 * everything is rebuilt from scratch.
 *
 * Usage:
 *   npm run db:setup
 */

import pg       from 'pg';
import fs       from 'fs';
import path     from 'path';
import { fileURLToPath } from 'url';
import dotenv   from 'dotenv';

dotenv.config();

// Resolve the path to schema.sql relative to this file.
const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, 'schema.sql');

async function setup() {
  console.log('🔌 Connecting to PostgreSQL…');

  const client = new pg.Client({
    host:     process.env.DB_HOST     || '127.0.0.1',
    port:     process.env.DB_PORT     || 5432,
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || 'maha8290',
    database: process.env.DB_NAME     || 'dayflow',
    ssl: false,
  });

  await client.connect();
  console.log('✅  Connected to PostgreSQL (database: dayflow)');

  try {
    const sql = fs.readFileSync(schemaPath, 'utf8');
    console.log('📋  Running schema.sql…');
    await client.query(sql);
    console.log('✅  Schema applied successfully!');
    console.log('');
    console.log('📌  Tables created:');
    const res = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    );
    res.rows.forEach((r) => console.log('    •', r.tablename));
  } finally {
    await client.end();
    console.log('');
    console.log('Done! Run `npm run db:seed` to load demo data.');
  }
}

setup().catch((err) => {
  console.error('❌  Setup failed:', err.message);
  process.exit(1);
});
