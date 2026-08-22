/**
 * @fileoverview LeaveRepository — data access for leave types, allocations, requests, and approvals.
 *
 * The approval flow here is intentionally transactional and uses SELECT … FOR UPDATE
 * to prevent two managers from approving the same request concurrently or a
 * double-deduction on the leave allocation balance.
 *
 * PostgreSQL differences from MySQL:
 * - ON DUPLICATE KEY UPDATE   →  ON CONFLICT … DO UPDATE
 * - YEAR(column)              →  EXTRACT(YEAR FROM column)
 * - is_paid = 0               →  is_paid = false
 * - All ? placeholders        →  $1, $2, …
 */

import { BaseRepository } from '../../core/BaseRepository.js';

export class LeaveRepository extends BaseRepository {
  /** @param {import('../../config/database.js').Database} db */
  constructor(db) {
    super(
      db,
      'leave_requests',
      [
        'id', 'employee_id', 'leave_type_id', 'start_date', 'end_date', 'days',
        'reason', 'attachment_url', 'status', 'reviewed_by', 'review_comment',
        'reviewed_at', 'created_at',
      ],
      ['id', 'start_date', 'created_at']
    );
  }

  // ── Leave Types ────────────────────────────────────────────────────────────────

  /**
   * Returns all leave types configured for a company.
   *
   * @param {number} companyId
   * @returns {Promise<Record<string, any>[]>}
   */
  async findAllTypes(companyId) {
    const result = await this._query(
      `SELECT id, company_id, name, is_paid, requires_attachment, default_days
         FROM leave_types
        WHERE company_id = $1
        ORDER BY id ASC`,
      [companyId]
    );
    return result.rows.map((r) => this.toCamelCase(r));
  }

  /**
   * Finds a single leave type by ID, scoped to a company.
   *
   * @param {number} id
   * @param {number} companyId
   * @returns {Promise<Record<string, any>|null>}
   */
  async findTypeById(id, companyId) {
    const result = await this._query(
      `SELECT * FROM leave_types WHERE id = $1 AND company_id = $2 LIMIT 1`,
      [id, companyId]
    );
    return result.rows.length ? this.toCamelCase(result.rows[0]) : null;
  }

  // ── Leave Allocations ──────────────────────────────────────────────────────────

  /**
   * Fetches an employee's leave balances for a given year,
   * including remaining days (allocated - used) computed in SQL.
   *
   * @param {number} employeeId
   * @param {number} year
   * @returns {Promise<Record<string, any>[]>}
   */
  async findAllocationsByEmployee(employeeId, year) {
    const result = await this._query(
      `SELECT la.id, la.employee_id, la.leave_type_id,
              lt.name AS leave_type_name,
              lt.is_paid, lt.requires_attachment,
              la.year, la.allocated_days, la.used_days,
              (la.allocated_days - la.used_days) AS remaining_days
         FROM leave_allocations la
         JOIN leave_types lt ON lt.id = la.leave_type_id
        WHERE la.employee_id = $1
          AND la.year = $2
        ORDER BY lt.id ASC`,
      [employeeId, year]
    );
    return result.rows.map((r) => this.toCamelCase(r));
  }

  /**
   * Fetches a specific leave allocation row and locks it for the current transaction.
   * Used during leave approval to prevent concurrent balance deductions.
   *
   * MUST be called inside a db.withTransaction() block.
   *
   * @param {number} employeeId
   * @param {number} leaveTypeId
   * @param {number} year
   * @param {import('pg').PoolClient} client
   * @returns {Promise<Record<string, any>|null>}
   */
  async findAllocationForUpdate(employeeId, leaveTypeId, year, client) {
    const result = await client.query(
      `SELECT id, employee_id, leave_type_id, year, allocated_days, used_days
         FROM leave_allocations
        WHERE employee_id = $1
          AND leave_type_id = $2
          AND year = $3
        FOR UPDATE`,
      [employeeId, leaveTypeId, year]
    );
    return result.rows.length ? this.toCamelCase(result.rows[0]) : null;
  }

  /**
   * Creates or updates a leave allocation for an employee.
   * Used when HR allocates leave for a new employee or updates an existing year.
   *
   * @param {{ employeeId: number, leaveTypeId: number, year: number, allocatedDays: number, usedDays?: number }} data
   * @returns {Promise<void>}
   */
  async upsertAllocation(data) {
    await this._query(
      `INSERT INTO leave_allocations (employee_id, leave_type_id, year, allocated_days, used_days)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (employee_id, leave_type_id, year)
       DO UPDATE SET allocated_days = EXCLUDED.allocated_days`,
      [data.employeeId, data.leaveTypeId, data.year, data.allocatedDays, data.usedDays ?? 0]
    );
  }

  /**
   * Saves updated used_days on an allocation inside a transaction.
   *
   * @param {number} allocationId
   * @param {number} newUsedDays
   * @param {import('pg').PoolClient} client
   */
  async updateAllocationUsedDays(allocationId, newUsedDays, client) {
    await client.query(
      `UPDATE leave_allocations SET used_days = $1 WHERE id = $2`,
      [newUsedDays, allocationId]
    );
  }

  // ── Leave Requests ─────────────────────────────────────────────────────────────

  /**
   * Checks for any pending or approved leave requests that overlap with a date range.
   * Used before submitting a new request to prevent double-booking.
   *
   * @param {number} employeeId
   * @param {string} startDate  - YYYY-MM-DD
   * @param {string} endDate    - YYYY-MM-DD
   * @param {number} [excludeId] - Skip a specific request ID (useful for edits)
   * @returns {Promise<Record<string, any>[]>}
   */
  async findOverlappingRequests(employeeId, startDate, endDate, excludeId = null) {
    const params = [employeeId, endDate, startDate];
    let sql = `
      SELECT id, start_date, end_date, status
        FROM leave_requests
       WHERE employee_id = $1
         AND status IN ('pending', 'approved')
         AND (start_date <= $2 AND end_date >= $3)
    `;
    if (excludeId) {
      params.push(excludeId);
      sql += ` AND id != $${params.length}`;
    }
    const result = await this._query(sql, params);
    return result.rows.map((r) => this.toCamelCase(r));
  }

  /**
   * Locks a leave request row for atomic review (approve / reject).
   * Prevents two managers from reviewing the same request simultaneously.
   *
   * MUST be called inside a db.withTransaction() block.
   *
   * @param {number} id
   * @param {import('pg').PoolClient} client
   * @returns {Promise<Record<string, any>|null>}
   */
  async lockRequestForReview(id, client) {
    const result = await client.query(
      `SELECT * FROM leave_requests WHERE id = $1 FOR UPDATE`,
      [id]
    );
    return result.rows.length ? this.toCamelCase(result.rows[0]) : null;
  }

  /**
   * Updates the status of a leave request after it has been reviewed.
   *
   * @param {number} id
   * @param {string} status    - 'approved' | 'rejected'
   * @param {number} reviewerId
   * @param {string} [comment]
   * @param {import('pg').PoolClient} client
   */
  async updateRequestStatus(id, status, reviewerId, comment, client) {
    await client.query(
      `UPDATE leave_requests
          SET status         = $1,
              reviewed_by    = $2,
              review_comment = $3,
              reviewed_at    = NOW()
        WHERE id = $4`,
      [status, reviewerId, comment || null, id]
    );
  }

  /**
   * Deletes a leave request — only allowed if it is still in 'pending' status
   * and belongs to the requesting employee.
   *
   * @param {number} id
   * @param {number} employeeId
   * @returns {Promise<boolean>}
   */
  async deletePendingRequest(id, employeeId) {
    const result = await this._query(
      `DELETE FROM leave_requests
        WHERE id = $1 AND employee_id = $2 AND status = 'pending'`,
      [id, employeeId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Checks whether an employee has an approved leave covering a specific date.
   * Used by attendance check-in to warn the employee.
   *
   * @param {number} employeeId
   * @param {string} workDate - YYYY-MM-DD
   * @returns {Promise<boolean>}
   */
  async findApprovedLeaveOnDate(employeeId, workDate) {
    const result = await this._query(
      `SELECT id FROM leave_requests
        WHERE employee_id = $1
          AND status = 'approved'
          AND $2::date BETWEEN start_date AND end_date
        LIMIT 1`,
      [employeeId, workDate]
    );
    return result.rows.length > 0;
  }

  /**
   * Sums approved unpaid leave days that fall inside a payroll period.
   * Used by the payslip calculator to deduct missing-attendance days.
   *
   * @param {number} employeeId
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<number>}
   */
  async countUnpaidLeaveDays(employeeId, startDate, endDate) {
    const result = await this._query(
      `SELECT COALESCE(SUM(lr.days), 0) AS total_unpaid_days
         FROM leave_requests lr
         JOIN leave_types lt ON lt.id = lr.leave_type_id
        WHERE lr.employee_id = $1
          AND lr.status      = 'approved'
          AND lt.is_paid     = false
          AND lr.start_date <= $2
          AND lr.end_date   >= $3`,
      [employeeId, endDate, startDate]
    );
    return Number(result.rows[0]?.total_unpaid_days ?? 0);
  }

  // ── List queries ───────────────────────────────────────────────────────────────

  /**
   * Returns a paginated, enriched list of leave requests with employee and reviewer info.
   * Admin sees all; employee sees only their own.
   *
   * @param {object} p
   * @param {number}  p.companyId
   * @param {number}  [p.employeeId]
   * @param {string}  [p.status]
   * @param {number}  [p.page=1]
   * @param {number}  [p.limit=20]
   * @returns {Promise<{ items: object[], total: number }>}
   */
  async findRequestsList({ companyId, employeeId, status, page = 1, limit = 20 }) {
    const offset     = (Math.max(1, page) - 1) * limit;
    const params     = [companyId];
    const conditions = [`e.company_id = $${params.length}`];

    if (employeeId) {
      params.push(employeeId);
      conditions.push(`lr.employee_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`lr.status = $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const limitIdx    = params.length + 1;
    const offsetIdx   = params.length + 2;

    const sql = `
      SELECT
        lr.id, lr.employee_id,
        e.login_id, e.first_name, e.last_name, e.avatar_url,
        d.name AS department_name,
        lr.leave_type_id, lt.name AS leave_type_name, lt.is_paid,
        lr.start_date, lr.end_date, lr.days,
        lr.reason, lr.attachment_url, lr.status,
        lr.reviewed_by,
        (r.first_name || ' ' || r.last_name) AS reviewer_name,
        lr.review_comment, lr.reviewed_at, lr.created_at
      FROM leave_requests lr
      JOIN employees e   ON e.id  = lr.employee_id
      LEFT JOIN departments d ON d.id  = e.department_id
      JOIN leave_types lt    ON lt.id = lr.leave_type_id
      LEFT JOIN employees r  ON r.id  = lr.reviewed_by
      ${whereClause}
      ORDER BY lr.created_at DESC
      LIMIT  $${limitIdx}
      OFFSET $${offsetIdx}
    `;

    const countSql = `
      SELECT COUNT(*) AS total
        FROM leave_requests lr
        JOIN employees e ON e.id = lr.employee_id
       ${whereClause}
    `;

    const [dataResult, countResult] = await Promise.all([
      this._query(sql, [...params, limit, offset]),
      this._query(countSql, params),
    ]);

    return {
      items: dataResult.rows.map((r) => this.toCamelCase(r)),
      total: Number(countResult.rows[0]?.total ?? 0),
    };
  }

  /**
   * Returns all approved leaves for a company in a given year for the calendar view.
   * PostgreSQL uses EXTRACT(YEAR FROM …) instead of MySQL's YEAR(…).
   *
   * @param {number} companyId
   * @param {number} year
   * @returns {Promise<object[]>}
   */
  async findCalendarLeaves(companyId, year) {
    const result = await this._query(
      `SELECT
         lr.id, lr.employee_id,
         e.first_name, e.last_name,
         lr.start_date, lr.end_date, lr.days,
         lt.name AS leave_type_name
       FROM leave_requests lr
       JOIN employees   e  ON e.id  = lr.employee_id
       JOIN leave_types lt ON lt.id = lr.leave_type_id
       WHERE e.company_id = $1
         AND lr.status    = 'approved'
         AND (EXTRACT(YEAR FROM lr.start_date) = $2
              OR EXTRACT(YEAR FROM lr.end_date) = $2)
       ORDER BY lr.start_date ASC`,
      [companyId, year]
    );
    return result.rows.map((r) => this.toCamelCase(r));
  }
}
