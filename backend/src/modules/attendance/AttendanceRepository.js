/**
 * @fileoverview AttendanceRepository — data access for check-ins, check-outs, monthly logs, and rosters.
 *
 * Notable PostgreSQL conversions from the MySQL version:
 * - ON DUPLICATE KEY UPDATE  →  INSERT … ON CONFLICT … DO UPDATE
 * - LIMIT/OFFSET still work the same way in PostgreSQL
 * - CONCAT(a, b)             →  (a || b)  or we just keep CONCAT (PostgreSQL supports it too)
 */

import { BaseRepository } from '../../core/BaseRepository.js';

export class AttendanceRepository extends BaseRepository {
  /** @param {import('../../config/database.js').Database} db */
  constructor(db) {
    super(
      db,
      'attendance',
      ['id', 'employee_id', 'work_date', 'check_in', 'check_out', 'work_minutes', 'extra_minutes', 'status'],
      ['id', 'work_date', 'check_in']
    );
  }

  /**
   * Finds the attendance record for one employee on one specific day.
   * Returns null if the employee hasn't checked in yet.
   *
   * @param {number} employeeId
   * @param {string} workDate - YYYY-MM-DD
   * @returns {Promise<Record<string, any>|null>}
   */
  async findByEmployeeAndDate(employeeId, workDate) {
    const result = await this._query(
      `SELECT * FROM attendance WHERE employee_id = $1 AND work_date = $2 LIMIT 1`,
      [employeeId, workDate]
    );
    return result.rows.length ? this.toCamelCase(result.rows[0]) : null;
  }

  /**
   * Records a check-in.  If a row already exists for today (shouldn't happen
   * with our front-end checks, but just in case), we update the check-in time
   * and flip the status back to 'present'.
   *
   * @param {number} employeeId
   * @param {string} workDate   - YYYY-MM-DD
   * @param {string} checkIn    - ISO 8601 datetime string
   * @returns {Promise<number>} The attendance row ID
   */
  async recordCheckIn(employeeId, workDate, checkIn) {
    const result = await this._query(
      `INSERT INTO attendance (employee_id, work_date, check_in, status)
       VALUES ($1, $2, $3, 'present')
       ON CONFLICT (employee_id, work_date)
       DO UPDATE SET check_in = EXCLUDED.check_in, status = 'present'
       RETURNING id`,
      [employeeId, workDate, checkIn]
    );
    return result.rows[0].id;
  }

  /**
   * Records a check-out and saves the computed work / extra minutes.
   *
   * @param {number} id           - Attendance row ID
   * @param {string} checkOut     - ISO 8601 datetime string
   * @param {number} workMinutes
   * @param {number} extraMinutes
   * @returns {Promise<boolean>}
   */
  async recordCheckOut(id, checkOut, workMinutes, extraMinutes) {
    const result = await this._query(
      `UPDATE attendance
          SET check_out     = $1,
              work_minutes  = $2,
              extra_minutes = $3
        WHERE id = $4`,
      [checkOut, workMinutes, extraMinutes, id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Fetches all attendance rows for an employee within a date range.
   * Used to build the monthly attendance calendar on the frontend.
   *
   * @param {number} employeeId
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate   - YYYY-MM-DD
   * @returns {Promise<Record<string, any>[]>}
   */
  async findMonthlyRecords(employeeId, startDate, endDate) {
    const result = await this._query(
      `SELECT id, employee_id, work_date, check_in, check_out,
              work_minutes, extra_minutes, status
         FROM attendance
        WHERE employee_id = $1
          AND work_date BETWEEN $2 AND $3
        ORDER BY work_date ASC`,
      [employeeId, startDate, endDate]
    );
    return result.rows.map((r) => this.toCamelCase(r));
  }

  /**
   * Aggregates attendance counts and total minutes for the monthly summary card.
   *
   * @param {number} employeeId
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<{ presentCount: number, halfDayCount: number, leaveCount: number, absentCount: number, totalWorkMinutes: number, totalExtraMinutes: number }>}
   */
  async getMonthlyAggregates(employeeId, startDate, endDate) {
    const result = await this._query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'present')  AS present_count,
         COUNT(*) FILTER (WHERE status = 'half_day') AS half_day_count,
         COUNT(*) FILTER (WHERE status = 'leave')    AS leave_count,
         COUNT(*) FILTER (WHERE status = 'absent')   AS absent_count,
         COALESCE(SUM(work_minutes),  0)             AS total_work_minutes,
         COALESCE(SUM(extra_minutes), 0)             AS total_extra_minutes
       FROM attendance
       WHERE employee_id = $1
         AND work_date BETWEEN $2 AND $3`,
      [employeeId, startDate, endDate]
    );
    const row = result.rows[0] ?? {};
    return {
      presentCount:      Number(row.present_count      ?? 0),
      halfDayCount:      Number(row.half_day_count     ?? 0),
      leaveCount:        Number(row.leave_count        ?? 0),
      absentCount:       Number(row.absent_count       ?? 0),
      totalWorkMinutes:  Number(row.total_work_minutes ?? 0),
      totalExtraMinutes: Number(row.total_extra_minutes ?? 0),
    };
  }

  /**
   * Returns the company-wide daily roster — one row per active employee showing
   * their attendance or leave status for a specific date.  Used by HR/admin.
   *
   * @param {object} p
   * @param {number}  p.companyId
   * @param {string}  p.workDate      - YYYY-MM-DD
   * @param {string}  [p.search]
   * @param {number}  [p.departmentId]
   * @param {number}  [p.page=1]
   * @param {number}  [p.limit=20]
   * @returns {Promise<{ items: object[], total: number }>}
   */
  async findDailyRoster({ companyId, workDate, search, departmentId, page = 1, limit = 20 }) {
    const offset = (Math.max(1, page) - 1) * limit;

    // Base filter params — workDate used twice in JOIN conditions so listed first.
    const params     = [workDate, workDate, companyId];
    const conditions = [`e.company_id = $${params.length}`, `e.status = 'active'`];

    if (departmentId) {
      params.push(departmentId);
      conditions.push(`e.department_id = $${params.length}`);
    }
    if (search) {
      const term = `%${search}%`;
      params.push(term, term, term);
      const n = params.length;
      conditions.push(`(e.first_name ILIKE $${n - 2} OR e.last_name ILIKE $${n - 1} OR e.login_id ILIKE $${n})`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const limitIdx    = params.length + 1;
    const offsetIdx   = params.length + 2;

    const sql = `
      SELECT
        e.id AS employee_id, e.login_id,
        e.first_name, e.last_name, e.avatar_url,
        d.name AS department_name,
        a.id          AS attendance_id,
        a.check_in, a.check_out, a.work_minutes, a.extra_minutes,
        CASE
          WHEN lr.id IS NOT NULL          THEN 'leave'
          WHEN a.check_in IS NOT NULL     THEN COALESCE(a.status::text, 'present')
          ELSE 'absent'
        END AS status
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN attendance   a
             ON a.employee_id = e.id
            AND a.work_date   = $1::date
      LEFT JOIN leave_requests lr
             ON lr.employee_id = e.id
            AND lr.status      = 'approved'
            AND $2::date BETWEEN lr.start_date AND lr.end_date
      ${whereClause}
      ORDER BY e.first_name ASC
      LIMIT  $${limitIdx}
      OFFSET $${offsetIdx}
    `;

    // Count query uses a separate, simpler param list to avoid duplication.
    const countParams     = [companyId];
    const countConditions = [`e.company_id = $1`, `e.status = 'active'`];
    if (departmentId) {
      countParams.push(departmentId);
      countConditions.push(`e.department_id = $${countParams.length}`);
    }
    if (search) {
      const term = `%${search}%`;
      countParams.push(term, term, term);
      const n = countParams.length;
      countConditions.push(`(e.first_name ILIKE $${n - 2} OR e.last_name ILIKE $${n - 1} OR e.login_id ILIKE $${n})`);
    }
    const countSql = `SELECT COUNT(*) AS total FROM employees e WHERE ${countConditions.join(' AND ')}`;

    const [dataResult, countResult] = await Promise.all([
      this._query(sql, [...params, limit, offset]),
      this._query(countSql, countParams),
    ]);

    return {
      items: dataResult.rows.map((r) => this.toCamelCase(r)),
      total: Number(countResult.rows[0]?.total ?? 0),
    };
  }

  /**
   * Marks a list of dates as 'leave' for an employee.
   * Called atomically when a leave request is approved so the attendance
   * calendar stays in sync with the leave record.
   *
   * ON CONFLICT means if the employee already has an attendance row for that
   * day (e.g. they checked in and then their manager approved a backdated leave)
   * we overwrite the status to 'leave'.
   *
   * @param {number}          employeeId
   * @param {string[]}        dates       - Array of YYYY-MM-DD strings
   * @param {import('pg').PoolClient} client - Transaction client
   * @returns {Promise<void>}
   */
  async upsertLeaveDays(employeeId, dates, client) {
    if (!dates.length) return;
    for (const d of dates) {
      await client.query(
        `INSERT INTO attendance (employee_id, work_date, status)
         VALUES ($1, $2, 'leave')
         ON CONFLICT (employee_id, work_date)
         DO UPDATE SET status = 'leave'`,
        [employeeId, d]
      );
    }
  }
}
