/**
 * @fileoverview Abstract base repository with common CRUD helpers.
 *
 * Every domain repository (EmployeeRepository, LeaveRepository, etc.) extends
 * this class and inherits safe, reusable data-access utilities.
 *
 * Key design decisions:
 * - PostgreSQL uses numbered placeholders ($1, $2, …) instead of MySQL's ?.
 *   The `_pg` helper converts a params array into the right placeholder list.
 * - snake_case <-> camelCase translation happens here so service/controller
 *   code only ever sees camelCase JavaScript objects.
 * - password_hash is scrubbed from selectableColumns automatically — it can
 *   never leak via a generic findById/findAll call.
 * - companyId scoping is built into every query so one company's data can
 *   never bleed into another's.
 */
export class BaseRepository {
  /**
   * @param {import('../config/database.js').Database} db
   * @param {string}   table              - Table name (e.g. 'employees')
   * @param {string[]} selectableColumns  - Columns safe to SELECT (password_hash is stripped)
   * @param {string[]} [allowedSortColumns] - Columns the caller is allowed to sort by
   */
  constructor(db, table, selectableColumns, allowedSortColumns = ['id', 'created_at']) {
    this.db = db;
    this.table = table;
    // Always strip password_hash — it must never be returned by a generic query.
    this.selectableColumns = selectableColumns.filter((c) => c !== 'password_hash');
    this.allowedSortColumns = allowedSortColumns;
  }

  // ── PostgreSQL placeholder helper ────────────────────────────────────────────

  /**
   * Converts a plain value array into PostgreSQL-style numbered placeholders.
   *
   * buildPlaceholders(['a','b','c'])  →  '$1, $2, $3'
   * buildPlaceholders([…], 3)        →  '$4, $5, $6'   (useful when extending an existing list)
   *
   * @param {unknown[]} values
   * @param {number}    [offset=0] - Start the counter from offset+1
   * @returns {string}
   */
  _buildPlaceholders(values, offset = 0) {
    return values.map((_, i) => `$${i + 1 + offset}`).join(', ');
  }

  // ── Case conversion ───────────────────────────────────────────────────────────

  /**
   * Turns a snake_case database row into a camelCase JavaScript object.
   * Handles nested objects too (e.g. JSON columns).
   *
   * @param {Record<string, any>} row
   * @returns {Record<string, any>}
   */
  toCamelCase(row) {
    if (!row || typeof row !== 'object') return row;
    const out = {};
    for (const [key, val] of Object.entries(row)) {
      const camel = key.replace(/_([a-z0-9])/g, (_, ch) => ch.toUpperCase());
      out[camel] = val;
    }
    return out;
  }

  /**
   * Turns a camelCase JavaScript object into snake_case database column names.
   *
   * @param {Record<string, any>} data
   * @returns {Record<string, any>}
   */
  toSnakeCase(data) {
    if (!data || typeof data !== 'object') return data;
    const out = {};
    for (const [key, val] of Object.entries(data)) {
      const snake = key.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`);
      out[snake] = val;
    }
    return out;
  }

  // ── Transaction binding ───────────────────────────────────────────────────────

  /**
   * Returns a shallow clone of this repository that routes queries through
   * the given poolClient instead of the shared pool.  Use inside
   * `db.withTransaction(async (client) => { … })`.
   *
   * @param {import('pg').PoolClient} client
   * @returns {this}
   */
  withTransaction(client) {
    const clone = Object.create(this);
    clone._txClient = client;
    return clone;
  }

  /**
   * Internal query dispatcher — uses explicit client if provided, or transaction client if bound,
   * otherwise falls back to the shared pool.
   *
   * @param {string}    sql
   * @param {unknown[]} params
   * @param {import('pg').PoolClient|null} [client]
   * @returns {Promise<import('pg').QueryResult>}
   */
  async _query(sql, params = [], client = null) {
    if (client) {
      return client.query(sql, params);
    }
    if (this._txClient) {
      return this._txClient.query(sql, params);
    }
    return this.db.query(sql, params);
  }

  // ── Generic CRUD helpers ──────────────────────────────────────────────────────

  /**
   * Find a single record by its primary key, optionally scoped to a company.
   *
   * @param {number}      id
   * @param {number|null} [companyId]
   * @param {import('pg').PoolClient|null} [client]
   * @returns {Promise<Record<string, any>|null>}
   */
  async findById(id, companyId = null, client = null) {
    const cols = this.selectableColumns.map((c) => `t.${c}`).join(', ');
    const params = [id];
    let sql = `SELECT ${cols} FROM ${this.table} t WHERE t.id = $1`;

    if (companyId !== null && this.selectableColumns.includes('company_id')) {
      params.push(companyId);
      sql += ` AND t.company_id = $2`;
    }

    const result = await this._query(sql, params, client);
    return result.rows.length ? this.toCamelCase(result.rows[0]) : null;
  }

  /**
   * List records with optional filtering, pagination, and sorting.
   *
   * @param {object}              [options]
   * @param {Record<string,any>}  [options.filters={}]
   * @param {number}              [options.page=1]
   * @param {number}              [options.limit=20]
   * @param {string}              [options.sort='id']
   * @param {'ASC'|'DESC'}        [options.sortOrder='DESC']
   * @param {number|null}         [options.companyId=null]
   * @param {import('pg').PoolClient|null} [client]
   * @returns {Promise<{ items: Record<string,any>[], total: number }>}
   */
  async findAll({ filters = {}, page = 1, limit = 20, sort = 'id', sortOrder = 'DESC', companyId = null } = {}, client = null) {
    // Whitelist the sort column to prevent SQL injection via query params.
    const safeSortCol = this.allowedSortColumns.includes(sort) ? sort : 'id';
    const safeOrder   = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const offset      = (Math.max(1, page) - 1) * limit;

    const { whereClause, params } = this._buildWhereClause(filters, companyId);
    const cols = this.selectableColumns.map((c) => `t.${c}`).join(', ');

    // Pagination params follow the where params.
    const limitIndex  = params.length + 1;
    const offsetIndex = params.length + 2;

    const dataSql  = `SELECT ${cols} FROM ${this.table} t ${whereClause} ORDER BY t.${safeSortCol} ${safeOrder} LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
    const countSql = `SELECT COUNT(*) AS total FROM ${this.table} t ${whereClause}`;

    const [dataResult, countResult] = await Promise.all([
      this._query(dataSql,  [...params, limit, offset], client),
      this._query(countSql, params, client),
    ]);

    return {
      items: dataResult.rows.map((r) => this.toCamelCase(r)),
      total: Number(countResult.rows[0]?.total ?? 0),
    };
  }

  /**
   * Insert a single record and return the new row's primary key.
   *
   * @param {Record<string, any>} data - camelCase keys; they will be snake_cased
   * @param {import('pg').PoolClient|null} [client]
   * @returns {Promise<number>}
   */
  async insert(data, client = null) {
    const snake  = this.toSnakeCase(data);
    const keys   = Object.keys(snake);
    const values = Object.values(snake);
    const placeholders = this._buildPlaceholders(values);

    const sql = `INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING id`;
    const result = await this._query(sql, values, client);
    return result.rows[0].id;
  }

  /**
   * Update fields on an existing record by ID.
   *
   * @param {number}              id
   * @param {Record<string, any>} data       - Fields to update (camelCase)
   * @param {number|null}         [companyId] - Optional extra safety scope
   * @param {import('pg').PoolClient|null} [client]
   * @returns {Promise<boolean>}  true if a row was actually updated
   */
  async updateById(id, data, companyId = null, client = null) {
    const snake   = this.toSnakeCase(data);
    const entries = Object.entries(snake);
    if (entries.length === 0) return false;

    const setClause = entries.map(([col], i) => `${col} = $${i + 1}`).join(', ');
    const params    = entries.map(([, val]) => val);
    params.push(id);

    let sql = `UPDATE ${this.table} SET ${setClause} WHERE id = $${params.length}`;

    if (companyId !== null && this.selectableColumns.includes('company_id')) {
      params.push(companyId);
      sql += ` AND company_id = $${params.length}`;
    }

    const result = await this._query(sql, params, client);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Delete a record by ID, optionally scoped to a company.
   *
   * @param {number}      id
   * @param {number|null} [companyId]
   * @param {import('pg').PoolClient|null} [client]
   * @returns {Promise<boolean>}
   */
  async deleteById(id, companyId = null, client = null) {
    const params = [id];
    let sql = `DELETE FROM ${this.table} WHERE id = $1`;

    if (companyId !== null && this.selectableColumns.includes('company_id')) {
      params.push(companyId);
      sql += ` AND company_id = $2`;
    }

    const result = await this._query(sql, params, client);
    return (result.rowCount ?? 0) > 0;
  }

  // ── Internal helpers ───────────────────────────────────────────────────────────

  /**
   * Builds a safe WHERE clause from a filter map.
   * Only columns in `selectableColumns` are allowed as filter keys.
   *
   * @protected
   * @param {Record<string, any>} filters
   * @param {number|null}         companyId
   * @returns {{ whereClause: string, params: unknown[] }}
   */
  _buildWhereClause(filters, companyId) {
    const conditions = [];
    const params     = [];

    if (companyId !== null && this.selectableColumns.includes('company_id')) {
      params.push(companyId);
      conditions.push(`t.company_id = $${params.length}`);
    }

    for (const [key, val] of Object.entries(this.toSnakeCase(filters))) {
      if (val !== undefined && val !== null && this.selectableColumns.includes(key)) {
        params.push(val);
        conditions.push(`t.${key} = $${params.length}`);
      }
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }
}
