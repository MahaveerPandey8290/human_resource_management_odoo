/**
 * Abstract BaseRepository providing core CRUD operations and snake_case <-> camelCase mapping.
 */
export class BaseRepository {
  /**
   * @param {import("../config/database.js").Database} db
   * @param {string} table
   * @param {string[]} selectableColumns
   * @param {string[]} [allowedSortColumns=[]]
   */
  constructor(db, table, selectableColumns, allowedSortColumns = ["id", "created_at"]) {
    this.db = db;
    this.table = table;
    this.selectableColumns = selectableColumns.filter((c) => c !== "password_hash");
    this.allowedSortColumns = allowedSortColumns;
  }

  /**
   * Converts a snake_case DB row to a camelCase object.
   * @param {Record<string, any>} row
   * @returns {Record<string, any>}
   */
  toCamelCase(row) {
    if (!row || typeof row !== "object") {return row;}
    const result = {};
    for (const [key, value] of Object.entries(row)) {
      const camelKey = key.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = value;
    }
    return result;
  }

  /**
   * Converts a camelCase object to snake_case DB column mappings.
   * @param {Record<string, any>} data
   * @returns {Record<string, any>}
   */
  toSnakeCase(data) {
    if (!data || typeof data !== "object") {return data;}
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      result[snakeKey] = value;
    }
    return result;
  }

  /**
   * Creates a transaction-bound repository instance.
   * @param {import("mysql2/promise").Connection} conn
   * @returns {this}
   */
  withTransaction(conn) {
    const clone = Object.create(this);
    clone.activeConn = conn;
    return clone;
  }

  /**
   * Finds a single record by primary key, optionally scoped by companyId.
   * @param {number|string} id
   * @param {number} [companyId]
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<Record<string, any>|null>}
   */
  async findById(id, companyId = null, conn = null) {
    const cols = this.selectableColumns.map((c) => `t.${c}`).join(", ");
    let sql = `SELECT ${cols} FROM ${this.table} t WHERE t.id = ?`;
    const params = [id];

    if (companyId !== null && this.selectableColumns.includes("company_id")) {
      sql += " AND t.company_id = ?";
      params.push(companyId);
    }

    const [rows] = await this.db.query(sql, params, `${this.table}.findById`, conn || this.activeConn);
    return rows.length ? this.toCamelCase(rows[0]) : null;
  }

  /**
   * Finds records matching conditions with pagination and sorting.
   * @param {object} options
   * @param {Record<string, any>} [options.filters={}]
   * @param {number} [options.page=1]
   * @param {number} [options.limit=20]
   * @param {string} [options.sort="id"]
   * @param {"ASC"|"DESC"} [options.sortOrder="DESC"]
   * @param {number} [options.companyId]
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<{ items: Array<Record<string, any>>, total: number }>}
   */
  async findAll({ filters = {}, page = 1, limit = 20, sort = "id", sortOrder = "DESC", companyId = null } = {}, conn = null) {
    const sortCol = this.allowedSortColumns.includes(sort) ? sort : "id";
    const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    const offset = (Math.max(1, page) - 1) * limit;

    const { whereClause, params } = this._buildWhereClause(filters, companyId);
    const cols = this.selectableColumns.map((c) => `t.${c}`).join(", ");

    const sql = `SELECT ${cols} FROM ${this.table} t ${whereClause} ORDER BY t.${sortCol} ${order} LIMIT ? OFFSET ?`;
    const countSql = `SELECT COUNT(*) AS total FROM ${this.table} t ${whereClause}`;

    const executor = conn || this.activeConn;
    const [rows] = await this.db.query(sql, [...params, limit, offset], `${this.table}.findAll`, executor);
    const [countRows] = await this.db.query(countSql, params, `${this.table}.count`, executor);

    return {
      items: rows.map((r) => this.toCamelCase(r)),
      total: Number(countRows[0]?.total || 0)
    };
  }

  /**
   * Inserts a record and returns the inserted ID.
   * @param {Record<string, any>} data
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<number>}
   */
  async insert(data, conn = null) {
    const snakeData = this.toSnakeCase(data);
    const keys = Object.keys(snakeData);
    const values = Object.values(snakeData);
    const placeholders = keys.map(() => "?").join(", ");

    const sql = `INSERT INTO ${this.table} (${keys.join(", ")}) VALUES (${placeholders})`;
    const [result] = await this.db.query(sql, values, `${this.table}.insert`, conn || this.activeConn);
    return result.insertId;
  }

  /**
   * Updates a record by primary key, optionally scoped by companyId.
   * @param {number|string} id
   * @param {Record<string, any>} data
   * @param {number} [companyId]
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<boolean>}
   */
  async updateById(id, data, companyId = null, conn = null) {
    const snakeData = this.toSnakeCase(data);
    const setEntries = Object.entries(snakeData);
    if (setEntries.length === 0) {return false;}

    const setClause = setEntries.map(([col]) => `${col} = ?`).join(", ");
    const params = setEntries.map(([, val]) => val);
    params.push(id);

    let sql = `UPDATE ${this.table} SET ${setClause} WHERE id = ?`;
    if (companyId !== null && this.selectableColumns.includes("company_id")) {
      sql += " AND company_id = ?";
      params.push(companyId);
    }

    const [result] = await this.db.query(sql, params, `${this.table}.updateById`, conn || this.activeConn);
    return result.affectedRows > 0;
  }

  /**
   * Deletes a record by primary key, optionally scoped by companyId.
   * @param {number|string} id
   * @param {number} [companyId]
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<boolean>}
   */
  async deleteById(id, companyId = null, conn = null) {
    let sql = `DELETE FROM ${this.table} WHERE id = ?`;
    const params = [id];

    if (companyId !== null && this.selectableColumns.includes("company_id")) {
      sql += " AND company_id = ?";
      params.push(companyId);
    }

    const [result] = await this.db.query(sql, params, `${this.table}.deleteById`, conn || this.activeConn);
    return result.affectedRows > 0;
  }

  /**
   * Builds WHERE clause safely.
   * @protected
   * @param {Record<string, any>} filters
   * @param {number|null} companyId
   * @returns {{ whereClause: string, params: Array<any> }}
   */
  _buildWhereClause(filters, companyId) {
    const conditions = [];
    const params = [];

    if (companyId !== null && this.selectableColumns.includes("company_id")) {
      conditions.push("t.company_id = ?");
      params.push(companyId);
    }

    for (const [key, val] of Object.entries(this.toSnakeCase(filters))) {
      if (val !== undefined && val !== null && this.selectableColumns.includes(key)) {
        conditions.push(`t.${key} = ?`);
        params.push(val);
      }
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
      params
    };
  }
}
