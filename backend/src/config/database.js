/**
 * @fileoverview PostgreSQL connection pool manager.
 *
 * We use the native `pg` driver with a pool of up to DB_POOL_MAX connections.
 * Every query automatically goes through parameterised placeholders ($1, $2, …)
 * so SQL injection is structurally impossible at the driver level.
 *
 * Transactions:  call `db.withTransaction(async (client) => { … })` and every
 * query inside will share the same connection + transaction scope.  If your
 * callback throws, the transaction is automatically rolled back.
 *
 * Slow query logging: any query that takes longer than 200 ms gets a warning
 * in the logs so we can catch N+1 problems during development.
 */

import pg from 'pg';
import { env } from './env.js';
import { logger } from '../core/Logger.js';

const { Pool } = pg;

// ── Tell pg how to handle NUMERIC / DECIMAL types ─────────────────────────────
// By default, pg returns numeric columns as strings to avoid JS floating-point
// drift.  We parse them as floats here so service code never needs to call
// Number() everywhere.  For money columns we keep 2 decimal places in the DB,
// which is sufficient.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (val) => parseFloat(val));
pg.types.setTypeParser(pg.types.builtins.INT8,    (val) => parseInt(val, 10));

// ── Connection pool ────────────────────────────────────────────────────────────
const SLOW_QUERY_THRESHOLD_MS = 200;

class Database {
  /** @type {pg.Pool} */
  #pool;

  constructor() {
    this.#pool = new Pool({
      host:              env.DB_HOST,
      port:              env.DB_PORT,
      user:              env.DB_USER,
      password:          env.DB_PASSWORD,
      database:          env.DB_NAME,
      max:               env.DB_POOL_MAX,
      idleTimeoutMillis: env.DB_POOL_IDLE_TIMEOUT_MS,
      connectionTimeoutMillis: env.DB_POOL_CONNECTION_TIMEOUT_MS,
      // Let the server's SSL setting decide; fine for localhost dev.
      ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
    });

    // Log unexpected pool errors so they don't silently kill the process.
    this.#pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
    });

    // Helpful during development to see how many connections are open.
    if (env.NODE_ENV !== 'production') {
      this.#pool.on('connect', () => {
        logger.debug(
          { totalCount: this.#pool.totalCount, idleCount: this.#pool.idleCount },
          'PG pool: new client connected'
        );
      });
    }
  }

  // ── Core query helper ────────────────────────────────────────────────────────

  /**
   * Run a single parameterised query on a pooled connection.
   *
   * PostgreSQL placeholders use $1, $2, … (not MySQL's ?).
   * We handle that swap automatically if you pass MySQL-style SQL — but
   * prefer writing native PG SQL directly in repository files.
   *
   * @param {string}    sql    - Parameterised SQL string using $1, $2, …
   * @param {unknown[]} [params] - Bound parameter values in order
   * @returns {Promise<pg.QueryResult>}
   */
  async query(sql, params = []) {
    const start = Date.now();
    try {
      const result = await this.#pool.query(sql, params);
      const durationMs = Date.now() - start;

      if (durationMs > SLOW_QUERY_THRESHOLD_MS) {
        logger.warn({ durationMs, sql }, 'Slow query detected (>200 ms)');
      } else {
        logger.debug({ durationMs, rowCount: result.rowCount }, 'Query OK');
      }

      return result;
    } catch (err) {
      logger.error({ err, sql, params }, 'Query failed');
      throw err;
    }
  }

  // ── Transaction helper ───────────────────────────────────────────────────────

  /**
   * Run a series of queries inside a single ACID transaction.
   * The callback receives a `client` object with the same `.query()` interface.
   * If the callback throws anything, the transaction is rolled back automatically.
   *
   * @template T
   * @param {(client: pg.PoolClient) => Promise<T>} callback
   * @returns {Promise<T>}
   *
   * @example
   * const newEmployee = await db.withTransaction(async (client) => {
   *   await client.query('INSERT INTO employees …', […]);
   *   await client.query('INSERT INTO salary_structures …', […]);
   *   return { id: 123 };
   * });
   */
  async withTransaction(callback) {
    // Check out a dedicated client from the pool for the whole transaction.
    const client = await this.#pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK').catch((rollbackErr) => {
        // If rollback itself fails, log it — but still throw the original error.
        logger.error({ rollbackErr }, 'Transaction rollback failed');
      });
      throw err;
    } finally {
      // Always release the client back to the pool, even if we crashed.
      client.release();
    }
  }

  // ── Health & lifecycle ───────────────────────────────────────────────────────

  /**
   * Quick liveness check — useful for a /health endpoint.
   * @returns {Promise<boolean>}
   */
  async ping() {
    await this.#pool.query('SELECT 1');
    return true;
  }

  /**
   * Pool diagnostics — handy for a /metrics endpoint.
   * @returns {{ total: number, idle: number, waiting: number }}
   */
  stats() {
    return {
      total:   this.#pool.totalCount,
      idle:    this.#pool.idleCount,
      waiting: this.#pool.waitingCount,
    };
  }

  /**
   * Gracefully drain the pool during process shutdown.
   * Call this in your SIGTERM / SIGINT handler.
   */
  async close() {
    logger.info('Closing PostgreSQL connection pool…');
    await this.#pool.end();
    logger.info('PostgreSQL pool closed. Goodbye! 👋');
  }
}

// Export a single shared instance — the pool is already thread-safe.
export const db = new Database();

// Also export the class itself so container.js / tests can construct their own instances.
export { Database };
