/**
 * @fileoverview Environment configuration loader.
 *
 * Reads .env (via dotenv), validates every variable with Zod, and
 * crashes the process immediately with a clear error if anything is
 * missing or wrong.  This is a "fail-fast" guard — problems are caught
 * at boot time, never silently mid-request.
 *
 * Usage anywhere in the codebase:
 *   import { env } from './config/env.js';
 *   console.log(env.PORT); // already typed + validated
 */

import dotenv from 'dotenv';
import { z }  from 'zod';

dotenv.config();

const envSchema = z.object({
  // ── Server ──────────────────────────────────────────────────────────────────
  PORT:     z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ── PostgreSQL connection (matches pgAdmin 4 settings) ───────────────────────
  DB_HOST:                      z.string().default('127.0.0.1'),
  DB_PORT:                      z.coerce.number().default(5432),
  DB_USER:                      z.string().default('postgres'),
  DB_PASSWORD:                  z.string().default('maha8290'),
  DB_NAME:                      z.string().default('dayflow'),
  DB_POOL_MAX:                  z.coerce.number().default(10),
  DB_POOL_IDLE_TIMEOUT_MS:      z.coerce.number().default(30_000),
  DB_POOL_CONNECTION_TIMEOUT_MS:z.coerce.number().default(5_000),

  // ── JWT / Auth ────────────────────────────────────────────────────────────
  JWT_SECRET:     z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  BCRYPT_ROUNDS:  z.coerce.number().default(12),

  // ── CORS ──────────────────────────────────────────────────────────────────
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:5173'),

  // ── Rate limiting ─────────────────────────────────────────────────────────
  RATE_LIMIT_WINDOW_MS:      z.coerce.number().default(900_000),
  RATE_LIMIT_MAX:            z.coerce.number().default(100),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
  AUTH_RATE_LIMIT_MAX:       z.coerce.number().default(5),

  // ── File uploads ──────────────────────────────────────────────────────────
  UPLOAD_DIR:              z.string().default('src/uploads'),
  MAX_AVATAR_SIZE_MB:      z.coerce.number().default(2),
  MAX_ATTACHMENT_SIZE_MB:  z.coerce.number().default(5),

  // ── Business rules ────────────────────────────────────────────────────────
  DEDUCT_BREAK_FROM_WORK_HOURS: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Write to stderr directly so this appears even if the logger hasn't booted.
  process.stderr.write(
    '❌  Invalid environment configuration — fix these before starting:\n' +
    JSON.stringify(parsed.error.format(), null, 2) +
    '\n'
  );
  process.exit(1);
}

export const env = parsed.data;
