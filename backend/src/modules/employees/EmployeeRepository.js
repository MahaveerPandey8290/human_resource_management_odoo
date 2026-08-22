/**
 * @fileoverview EmployeeRepository — data access for employee profiles, card grids, and Login ID generation.
 *
 * The most important query here is `findAllWithTodayStatus`.  It resolves each
 * employee's real-time attendance state in a SINGLE SQL query using LEFT JOINs —
 * no N+1 loops, no separate status requests per employee.
 *
 * Priority chain (handled entirely in SQL CASE):
 *   approved leave today  →  'on_leave'
 *   checked in today      →  'present'
 *   otherwise             →  'absent'
 */

import { BaseRepository } from '../../core/BaseRepository.js';

export class EmployeeRepository extends BaseRepository {
  /** @param {import('../../config/database.js').Database} db */
  constructor(db) {
    super(
      db,
      'employees',
      [
        'id', 'company_id', 'login_id', 'work_email', 'must_change_password', 'role',
        'first_name', 'last_name', 'phone', 'avatar_url', 'job_position', 'department_id',
        'manager_id', 'work_location', 'date_of_joining', 'emp_code', 'dob', 'gender',
        'marital_status', 'nationality', 'personal_email', 'address', 'bank_name',
        'account_number', 'ifsc', 'pan', 'uan', 'about', 'job_love', 'interests',
        'status', 'created_at', 'updated_at',
      ],
      ['id', 'first_name', 'date_of_joining', 'created_at']
    );
  }

  /**
   * Returns the paginated employee card grid with each person's attendance state
   * for TODAY — all resolved in a single SQL query (zero N+1 calls).
   *
   * @param {object} p
   * @param {number}  p.companyId
   * @param {string}  [p.search]        - Name / login-ID / email search term
   * @param {number}  [p.departmentId]
   * @param {string}  [p.status]        - 'active' | 'inactive'
   * @param {number}  [p.page=1]
   * @param {number}  [p.limit=20]
   * @param {string}  [p.sort='id']
   * @param {string}  [p.sortOrder='DESC']
   * @param {string}  p.todayDate       - YYYY-MM-DD
   * @returns {Promise<{ items: object[], total: number }>}
   */
  async findAllWithTodayStatus({ companyId, search, departmentId, status, page = 1, limit = 20, sort = 'id', sortOrder = 'DESC', todayDate }) {
    const safeSortCol = this.allowedSortColumns.includes(sort) ? `t.${sort}` : 't.id';
    const safeOrder   = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const offset      = (Math.max(1, page) - 1) * limit;

    const { whereClause, params } = this._buildListFilters(companyId, search, departmentId, status);

    // todayDate appears twice in the JOIN conditions — we append it at the front
    // of the param list so the numbered placeholders align properly.
    const todayIndex1 = params.length + 1;
    const todayIndex2 = params.length + 2;
    const limitIndex  = params.length + 3;
    const offsetIndex = params.length + 4;

    const sql = `
      SELECT
        t.id, t.company_id, t.login_id, t.work_email, t.role,
        t.first_name, t.last_name, t.phone, t.avatar_url, t.job_position,
        t.department_id, d.name AS department_name,
        t.manager_id, (m.first_name || ' ' || m.last_name) AS manager_name,
        t.work_location, t.date_of_joining, t.status,
        CASE
          WHEN lr.id IS NOT NULL THEN 'on_leave'
          WHEN a.check_in  IS NOT NULL THEN 'present'
          ELSE 'absent'
        END AS today_status
      FROM employees t
      LEFT JOIN departments d   ON d.id = t.department_id
      LEFT JOIN employees m     ON m.id = t.manager_id
      LEFT JOIN leave_requests lr
             ON lr.employee_id = t.id
            AND lr.status = 'approved'
            AND $${todayIndex1}::date BETWEEN lr.start_date AND lr.end_date
      LEFT JOIN attendance a
             ON a.employee_id = t.id
            AND a.work_date = $${todayIndex2}::date
      ${whereClause}
      ORDER BY ${safeSortCol} ${safeOrder}
      LIMIT  $${limitIndex}
      OFFSET $${offsetIndex}
    `;

    const countSql = `
      SELECT COUNT(*) AS total
      FROM employees t
      ${whereClause}
    `;

    const queryParams = [...params, todayDate, todayDate, limit, offset];

    const [dataResult, countResult] = await Promise.all([
      this.db.query(sql, queryParams),
      this.db.query(countSql, params),
    ]);

    return {
      items: dataResult.rows.map((r) => this.toCamelCase(r)),
      total: Number(countResult.rows[0]?.total ?? 0),
    };
  }

  /**
   * Generates the next unique serial number for a company+year pair
   * using an atomic INSERT … ON CONFLICT + SELECT FOR UPDATE pattern.
   *
   * Two simultaneous employee creations for the same company in the same year
   * will serialize here — one will win the lock, increment, release, and then
   * the second one will see the incremented value.  They can never both get
   * the same serial number.
   *
   * @param {number} companyId
   * @param {number} joinYear
   * @param {import('pg').PoolClient} client - Must be inside a transaction
   * @returns {Promise<number>}
   */
  async getNextSerialAtomic(companyId, joinYear, client) {
    // Atomically insert or increment the counter.
    await client.query(
      `INSERT INTO login_id_sequences (company_id, join_year, last_serial)
       VALUES ($1, $2, 1)
       ON CONFLICT (company_id, join_year)
       DO UPDATE SET last_serial = login_id_sequences.last_serial + 1`,
      [companyId, joinYear]
    );

    // Read back the value while holding the row lock so no other transaction
    // can sneak in between the increment and the read.
    const result = await client.query(
      `SELECT last_serial
         FROM login_id_sequences
        WHERE company_id = $1 AND join_year = $2
        FOR UPDATE`,
      [companyId, joinYear]
    );
    return Number(result.rows[0].last_serial);
  }

  /**
   * Looks up the two-letter company code used as the Login ID prefix.
   * Falls back to "CO" if something unexpected happens.
   *
   * @param {number} companyId
   * @returns {Promise<string>}
   */
  async getCompanyCode(companyId, client = null) {
    const result = await this._query(
      `SELECT code FROM companies WHERE id = $1 LIMIT 1`,
      [companyId],
      client
    );
    return result.rows.length ? result.rows[0].code : 'CO';
  }

  /**
   * Saves a new avatar URL for an employee.
   *
   * @param {number} id
   * @param {string} avatarUrl
   * @param {number} companyId
   * @returns {Promise<boolean>}
   */
  async updateAvatar(id, avatarUrl, companyId) {
    const result = await this._query(
      `UPDATE employees SET avatar_url = $1 WHERE id = $2 AND company_id = $3`,
      [avatarUrl, id, companyId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Finds an employee by their work email address.
   * @param {string} email
   * @param {import('pg').PoolClient|null} [client]
   * @returns {Promise<object|null>}
   */
  async findByEmail(email, client = null) {
    const result = await this._query(
      `SELECT id, company_id, login_id, work_email FROM employees WHERE LOWER(work_email) = LOWER($1) LIMIT 1`,
      [email],
      client
    );
    return result.rows.length ? this.toCamelCase(result.rows[0]) : null;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Builds the WHERE clause for the employee list query with numbered PG params.
   *
   * @private
   * @param {number}      companyId
   * @param {string|null} search
   * @param {number|null} departmentId
   * @param {string|null} status
   * @returns {{ whereClause: string, params: unknown[] }}
   */
  _buildListFilters(companyId, search, departmentId, status) {
    const params     = [companyId];
    const conditions = [`t.company_id = $${params.length}`];

    if (status) {
      params.push(status);
      conditions.push(`t.status = $${params.length}`);
    }

    if (departmentId) {
      params.push(departmentId);
      conditions.push(`t.department_id = $${params.length}`);
    }

    if (search) {
      const term = `%${search}%`;
      params.push(term, term, term, term);
      const n = params.length;
      conditions.push(
        `(t.first_name ILIKE $${n - 3} OR t.last_name ILIKE $${n - 2} OR t.login_id ILIKE $${n - 1} OR t.work_email ILIKE $${n})`
      );
    }

    return {
      whereClause: `WHERE ${conditions.join(' AND ')}`,
      params,
    };
  }
}
