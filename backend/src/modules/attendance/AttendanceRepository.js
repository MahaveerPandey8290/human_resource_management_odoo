/**
 * @file AttendanceRepository.js
 * Owns raw SQL queries for attendance recording, check-ins, monthly logs, and roster reporting.
 * Must not contain HTTP logic or business rules.
 */

import { BaseRepository } from "../../core/BaseRepository.js";

export class AttendanceRepository extends BaseRepository {
  /**
   * @param {import("../../config/database.js").Database} db
   */
  constructor(db) {
    super(
      db,
      "attendance",
      ["id", "employee_id", "work_date", "check_in", "check_out", "work_minutes", "extra_minutes", "status"],
      ["id", "work_date", "check_in"]
    );
  }

  /**
   * Finds attendance record for a specific employee and date.
   * @param {number} employeeId
   * @param {string} workDate YYYY-MM-DD
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<Record<string, any>|null>}
   */
  async findByEmployeeAndDate(employeeId, workDate, conn = null) {
    const sql = `SELECT * FROM attendance WHERE employee_id = ? AND work_date = ? LIMIT 1`;
    const [rows] = await this.db.query(sql, [employeeId, workDate], "AttendanceRepository.findByEmployeeAndDate", conn || this.activeConn);
    return rows.length ? this.toCamelCase(rows[0]) : null;
  }

  /**
   * Inserts a check-in record.
   * @param {number} employeeId
   * @param {string} workDate
   * @param {string} checkIn
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<number>}
   */
  async recordCheckIn(employeeId, workDate, checkIn, conn = null) {
    const sql = `
      INSERT INTO attendance (employee_id, work_date, check_in, status)
      VALUES (?, ?, ?, 'present')
      ON DUPLICATE KEY UPDATE check_in = VALUES(check_in), status = 'present'
    `;
    const [result] = await this.db.query(sql, [employeeId, workDate, checkIn], "AttendanceRepository.recordCheckIn", conn || this.activeConn);
    return result.insertId;
  }

  /**
   * Updates check-out details and computed work/extra minutes.
   * @param {number} id
   * @param {string} checkOut
   * @param {number} workMinutes
   * @param {number} extraMinutes
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<boolean>}
   */
  async recordCheckOut(id, checkOut, workMinutes, extraMinutes, conn = null) {
    const sql = `
      UPDATE attendance
      SET check_out = ?, work_minutes = ?, extra_minutes = ?
      WHERE id = ?
    `;
    const [result] = await this.db.query(sql, [checkOut, workMinutes, extraMinutes, id], "AttendanceRepository.recordCheckOut", conn || this.activeConn);
    return result.affectedRows > 0;
  }

  /**
   * Fetches monthly attendance rows for an employee.
   * @param {number} employeeId
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<Array<Record<string, any>>>}
   */
  async findMonthlyRecords(employeeId, startDate, endDate) {
    const sql = `
      SELECT id, employee_id, work_date, check_in, check_out, work_minutes, extra_minutes, status
      FROM attendance
      WHERE employee_id = ? AND work_date BETWEEN ? AND ?
      ORDER BY work_date ASC
    `;
    const [rows] = await this.db.query(sql, [employeeId, startDate, endDate], "AttendanceRepository.findMonthlyRecords");
    return rows.map((r) => this.toCamelCase(r));
  }

  /**
   * Fetches aggregated attendance counts for summary calculations.
   * @param {number} employeeId
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<Record<string, number>>}
   */
  async getMonthlyAggregates(employeeId, startDate, endDate) {
    const sql = `
      SELECT 
        COUNT(CASE WHEN status = 'present' THEN 1 END) AS present_count,
        COUNT(CASE WHEN status = 'half_day' THEN 1 END) AS half_day_count,
        COUNT(CASE WHEN status = 'leave' THEN 1 END) AS leave_count,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) AS absent_count,
        SUM(work_minutes) AS total_work_minutes,
        SUM(extra_minutes) AS total_extra_minutes
      FROM attendance
      WHERE employee_id = ? AND work_date BETWEEN ? AND ?
    `;
    const [rows] = await this.db.query(sql, [employeeId, startDate, endDate], "AttendanceRepository.getMonthlyAggregates");
    return {
      presentCount: Number(rows[0]?.present_count || 0),
      halfDayCount: Number(rows[0]?.half_day_count || 0),
      leaveCount: Number(rows[0]?.leave_count || 0),
      absentCount: Number(rows[0]?.absent_count || 0),
      totalWorkMinutes: Number(rows[0]?.total_work_minutes || 0),
      totalExtraMinutes: Number(rows[0]?.total_extra_minutes || 0)
    };
  }

  /**
   * Retrieves company-wide daily attendance roster with employee details.
   * @param {object} params
   * @param {number} params.companyId
   * @param {string} params.workDate
   * @param {string} [params.search]
   * @param {number} [params.departmentId]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @returns {Promise<{ items: Array<object>, total: number }>}
   */
  async findDailyRoster({ companyId, workDate, search, departmentId, page = 1, limit = 20 }) {
    const offset = (Math.max(1, page) - 1) * limit;
    const conditions = ["e.company_id = ?", "e.status = 'active'"];
    const params = [workDate, workDate, companyId];

    if (departmentId) {
      conditions.push("e.department_id = ?");
      params.push(departmentId);
    }
    if (search) {
      conditions.push("(e.first_name LIKE ? OR e.last_name LIKE ? OR e.login_id LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const sql = `
      SELECT 
        e.id AS employee_id, e.login_id, e.first_name, e.last_name, e.avatar_url,
        d.name AS department_name,
        a.id AS attendance_id,
        a.check_in, a.check_out, a.work_minutes, a.extra_minutes,
        CASE
          WHEN lr.id IS NOT NULL THEN 'leave'
          WHEN a.check_in IS NOT NULL THEN COALESCE(a.status, 'present')
          ELSE 'absent'
        END AS status
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN attendance a ON a.employee_id = e.id AND a.work_date = ?
      LEFT JOIN leave_requests lr ON lr.employee_id = e.id AND lr.status = 'approved' AND ? BETWEEN lr.start_date AND lr.end_date
      ${whereClause}
      ORDER BY e.first_name ASC
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) AS total
      FROM employees e
      WHERE e.company_id = ? AND e.status = 'active'
      ${departmentId ? "AND e.department_id = ?" : ""}
      ${search ? "AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.login_id LIKE ?)" : ""}
    `;

    const countParams = [companyId];
    if (departmentId) {countParams.push(departmentId);}
    if (search) {
      const term = `%${search}%`;
      countParams.push(term, term, term);
    }

    const [rows] = await this.db.query(sql, [...params, limit, offset], "AttendanceRepository.findDailyRoster");
    const [countRows] = await this.db.query(countSql, countParams, "AttendanceRepository.countDailyRoster");

    return {
      items: rows.map((r) => this.toCamelCase(r)),
      total: Number(countRows[0]?.total || 0)
    };
  }

  /**
   * Bulk upserts attendance records as 'leave' for approved date range.
   * @param {number} employeeId
   * @param {string[]} dates
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<void>}
   */
  async upsertLeaveDays(employeeId, dates, conn = null) {
    if (!dates.length) {return;}
    for (const d of dates) {
      const sql = `
        INSERT INTO attendance (employee_id, work_date, status)
        VALUES (?, ?, 'leave')
        ON DUPLICATE KEY UPDATE status = 'leave'
      `;
      await this.db.query(sql, [employeeId, d], "AttendanceRepository.upsertLeaveDays", conn || this.activeConn);
    }
  }
}
