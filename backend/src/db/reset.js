import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, 'schema.sql');

async function runReset() {
  process.stdout.write('Resetting PostgreSQL database...\n');
  const client = new pg.Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'maha8290',
    database: process.env.DB_NAME || 'dayflow',
  });

  try {
    await client.connect();
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(sql);
    process.stdout.write('Database dayflow schema reset and cleaned completely.\n');
  } catch (err) {
    process.stderr.write(`Database reset failed: ${err.message}\n`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runReset();
