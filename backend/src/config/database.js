import mysql from "mysql2/promise";
import { env } from "./env.js";

/**
 * Database wrapper managing MySQL2 connection pool, queries, and transactions.
 */
export class Database {
  /**
   * @param {import("../core/Logger.js").Logger} logger
   */
  constructor(logger) {
    this.logger = logger;
    this.pool = mysql.createPool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      waitForConnections: true,
      connectionLimit: env.DB_POOL_LIMIT,
      queueLimit: 0,
      dateStrings: true,
      decimalNumbers: true
    });
  }

  /**
   * Executes a parameterized query against pool or a transaction connection.
   * Logs queries taking longer than 200ms.
   * @param {string} sql
   * @param {Array<any>} [params=[]]
   * @param {string} [label="SQL_QUERY"]
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<[any, any]>}
   */
  async query(sql, params = [], label = "SQL_QUERY", conn = null) {
    const start = Date.now();
    const executor = conn || this.pool;
    try {
      const result = await executor.query(sql, params);
      const duration = Date.now() - start;
      if (duration > 200) {
        this.logger.warn({ label, duration, sql }, `Slow query detected [${label}] took ${duration}ms`);
      }
      return result;
    } catch (err) {
      this.logger.error({ label, sql, params, err: err.message }, `Database query error [${label}]`);
      throw err;
    }
  }

  /**
   * Runs a callback inside a database transaction with automatic commit/rollback.
   * @template T
   * @param {(conn: import("mysql2/promise").PoolConnection) => Promise<T>} callback
   * @returns {Promise<T>}
   */
  async transaction(callback) {
    const conn = await this.pool.getConnection();
    await conn.beginTransaction();
    try {
      const result = await callback(conn);
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Retrieves active connection pool metrics.
   * @returns {{ total: number, active: number, idle: number, queued: number }}
   */
  getPoolMetrics() {
    return {
      total: this.pool.pool?._allConnections?.length || 0,
      active: (this.pool.pool?._allConnections?.length || 0) - (this.pool.pool?._freeConnections?.length || 0),
      idle: this.pool.pool?._freeConnections?.length || 0,
      queued: this.pool.pool?._connectionQueue?.length || 0
    };
  }

  /**
   * Closes the database pool.
   * @returns {Promise<void>}
   */
  async close() {
    await this.pool.end();
  }
}
