/**
 * BaseService providing shared service-layer helpers and logging.
 */
export class BaseService {
  /**
   * @param {import("../config/database.js").Database} db
   * @param {import("./Logger.js").Logger} logger
   */
  constructor(db, logger) {
    this.db = db;
    this.logger = logger;
  }

  /**
   * Runs business logic inside a managed transaction.
   * @template T
   * @param {(conn: import("mysql2/promise").PoolConnection) => Promise<T>} callback
   * @returns {Promise<T>}
   */
  async withTransaction(callback) {
    return this.db.transaction(callback);
  }
}
