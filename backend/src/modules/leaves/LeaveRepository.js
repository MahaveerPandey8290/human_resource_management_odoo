/**
 * @file LeaveRepository.js
 * Owns raw SQL queries for leave types, allocations, requests, and transactional review locks.
 * Must not contain business rules or HTTP logic.
 */

import { BaseRepository } from "../../core/BaseRepository.js";

export class LeaveRepository extends BaseRepository {
  /**
   * @param {import("../../config/database.js").Database} db
   */
  constructor(db) {
    super(
      db,
      "leave_requests",
      [
        "id", "employee_id", "leave_type_id", "start_date", "end_date", "days",
        "reason", "attachment_url", "status", "reviewed_by", "review_comment",
        "reviewed_at", "created_at"
      ],
      ["id", "start_date", "created_at"]
    );
  }

  /**
   * Finds all leave types for a company.
   * @param {number} companyId
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<Array<Record<string, any>>>}
   */
  async findAllTypes(companyId, conn = null) {
    const sql = `SELECT id, company_id, name, is_paid, requires_attachment, default_days FROM leave_types WHERE company_id = ? ORDER BY id ASC`;
    const [rows] = await this.db.query(sql, [companyId], "LeaveRepository.findAllTypes", conn || this.activeConn);
    return rows.map((r) => this.toCamelCase(r));
  }

  /**
   * Finds single leave type by ID and companyId.
   * @param {number} id
   * @param {number} companyId
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<Record<string, any>|null>}
   */
  async findTypeById(id, companyId, conn = null) {
    const sql = `SELECT * FROM leave_types WHERE id = ? AND company_id = ? LIMIT 1`;
    const [rows] = await this.db.query(sql, [id, companyId], "LeaveRepository.findTypeById", conn || this.activeConn);
    return rows.length ? this.toCamelCase(rows[0]) : null;
  }

  /**
   * Finds leave allocations for an employee and year.
   * @param {number} employeeId
   * @param {number} year
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<Array<Record<string, any>>>}
   */
  async findAllocationsByEmployee(employeeId, year, conn = null) {
    const sql = `
      SELECT la.id, la.employee_id, la.leave_type_id, lt.name AS leave_type_name,
             lt.is_paid, lt.requires_attachment, la.year, la.allocated_days, la.used_days,
             (la.allocated_days - la.used_days) AS remaining_days
      FROM leave_allocations la
      JOIN leave_types lt ON lt.id = la.leave_type_id
      WHERE la.employee_id = ? AND la.year = ?
      ORDER BY lt.id ASC
    `;
    const [rows] = await this.db.query(sql, [employeeId, year], "LeaveRepository.findAllocationsByEmployee", conn || this.activeConn);
    return rows.map((r) => this.toCamelCase(r));
  }

  /**
   * Finds a specific allocation record with lock option.
   * @param {number} employeeId
   * @param {number} leaveTypeId
   * @param {number} year
   * @param {import("mysql2/promise").Connection} conn
   * @returns {Promise<Record<string, any>|null>}
   */
  async findAllocationForUpdate(employeeId, leaveTypeId, year, conn) {
    const sql = `
      SELECT id, employee_id, leave_type_id, year, allocated_days, used_days
      FROM leave_allocations
      WHERE employee_id = ? AND leave_type_id = ? AND year = ?
      FOR UPDATE
    `;
    const [rows] = await this.db.query(sql, [employeeId, leaveTypeId, year], "LeaveRepository.findAllocationForUpdate", conn);
    return rows.length ? this.toCamelCase(rows[0]) : null;
  }

  /**
   * Upserts a leave allocation.
   * @param {object} data
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<void>}
   */
  async upsertAllocation(data, conn = null) {
    const sql = `
      INSERT INTO leave_allocations (employee_id, leave_type_id, year, allocated_days, used_days)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE allocated_days = VALUES(allocated_days)
    `;
    await this.db.query(
      sql,
      [data.employeeId, data.leaveTypeId, data.year, data.allocatedDays, data.usedDays || 0.0],
      "LeaveRepository.upsertAllocation",
      conn || this.activeConn
    );
  }

  /**
   * Updates used days on an allocation.
   * @param {number} allocationId
   * @param {number} newUsedDays
   * @param {import("mysql2/promise").Connection} conn
   * @returns {Promise<void>}
   */
  async updateAllocationUsedDays(allocationId, newUsedDays, conn) {
    const sql = `UPDATE leave_allocations SET used_days = ? WHERE id = ?`;
    await this.db.query(sql, [newUsedDays, allocationId], "LeaveRepository.updateAllocationUsedDays", conn);
  }

  /**
   * Finds overlapping leave requests for an employee.
   * @param {number} employeeId
   * @param {string} startDate
   * @param {string} endDate
   * @param {number} [excludeId]
   * @returns {Promise<Array<object>>}
   */
  async findOverlappingRequests(employeeId, startDate, endDate, excludeId = null) {
    let sql = `
      SELECT id, start_date, end_date, status
      FROM leave_requests
      WHERE employee_id = ?
        AND status IN ('pending', 'approved')
        AND (start_date <= ? AND end_date >= ?)
    `;
    const params = [employeeId, endDate, startDate];
    if (excludeId) {
      sql += " AND id != ?";
      params.push(excludeId);
    }
    const [rows] = await this.db.query(sql, params, "LeaveRepository.findOverlappingRequests");
    return rows.map((r) => this.toCamelCase(r));
  }

  /**
   * Locks and retrieves a leave request for transactional review.
   * @param {number} id
   * @param {import("mysql2/promise").Connection} conn
   * @returns {Promise<Record<string, any>|null>}
   */
  async lockRequestForReview(id, conn) {
    const sql = `SELECT * FROM leave_requests WHERE id = ? FOR UPDATE`;
    const [rows] = await this.db.query(sql, [id], "LeaveRepository.lockRequestForReview", conn);
    return rows.length ? this.toCamelCase(rows[0]) : null;
  }

  /**
   * Updates status of a reviewed leave request.
   * @param {number} id
   * @param {string} status
   * @param {number} reviewerId
   * @param {string} [comment]
   * @param {import("mysql2/promise").Connection} conn
   * @returns {Promise<void>}
   */
  async updateRequestStatus(id, status, reviewerId, comment, conn) {
    const sql = `
      UPDATE leave_requests
      SET status = ?, reviewed_by = ?, review_comment = ?, reviewed_at = NOW()
      WHERE id = ?
    `;
    await this.db.query(sql, [status, reviewerId, comment || null, id], "LeaveRepository.updateRequestStatus", conn);
  }

  /**
   * Deletes a pending leave request belonging to an employee.
   * @param {number} id
   * @param {number} employeeId
   * @returns {Promise<boolean>}
   */
  async deletePendingRequest(id, employeeId) {
    const sql = `DELETE FROM leave_requests WHERE id = ? AND employee_id = ? AND status = 'pending'`;
    const [res] = await this.db.query(sql, [id, employeeId], "LeaveRepository.deletePendingRequest");
    return res.affectedRows > 0;
  }

  /**
   * Checks if an employee has an approved leave covering a specific date.
   * @param {number} employeeId
   * @param {string} workDate
   * @returns {Promise<boolean>}
   */
  async findApprovedLeaveOnDate(employeeId, workDate) {
    const sql = `
      SELECT id FROM leave_requests
      WHERE employee_id = ? AND status = 'approved' AND ? BETWEEN start_date AND end_date
      LIMIT 1
    `;
    const [rows] = await this.db.query(sql, [employeeId, workDate], "LeaveRepository.findApprovedLeaveOnDate");
    return rows.length > 0;
  }

  /**
   * Counts unpaid leave days for an employee within a date range.
   * @param {number} employeeId
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<number>}
   */
  async countUnpaidLeaveDays(employeeId, startDate, endDate) {
    const sql = `
      SELECT COALESCE(SUM(lr.days), 0) AS total_unpaid_days
      FROM leave_requests lr
      JOIN leave_types lt ON lt.id = lr.leave_type_id
      WHERE lr.employee_id = ? AND lr.status = 'approved' AND lt.is_paid = 0
        AND lr.start_date <= ? AND lr.end_date >= ?
    `;
    const [rows] = await this.db.query(sql, [employeeId, endDate, startDate], "LeaveRepository.countUnpaidLeaveDays");
    return Number(rows[0]?.total_unpaid_days || 0);
  }

  /**
   * Lists leave requests with employee details.
   * @param {object} params
   * @param {number} params.companyId
   * @param {number} [params.employeeId]
   * @param {string} [params.status]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @returns {Promise<{ items: Array<object>, total: number }>}
   */
  async findRequestsList({ companyId, employeeId, status, page = 1, limit = 20 }) {
    const offset = (Math.max(1, page) - 1) * limit;
    const conditions = ["e.company_id = ?"];
    const params = [companyId];

    if (employeeId) {
      conditions.push("lr.employee_id = ?");
      params.push(employeeId);
    }
    if (status) {
      conditions.push("lr.status = ?");
      params.push(status);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    const sql = `
      SELECT 
        lr.id, lr.employee_id, e.login_id, e.first_name, e.last_name, e.avatar_url,
        d.name AS department_name,
        lr.leave_type_id, lt.name AS leave_type_name, lt.is_paid,
        lr.start_date, lr.end_date, lr.days, lr.reason, lr.attachment_url, lr.status,
        lr.reviewed_by, CONCAT(r.first_name, ' ', r.last_name) AS reviewer_name,
        lr.review_comment, lr.reviewed_at, lr.created_at
      FROM leave_requests lr
      JOIN employees e ON e.id = lr.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      JOIN leave_types lt ON lt.id = lr.leave_type_id
      LEFT JOIN employees r ON r.id = lr.reviewed_by
      ${whereClause}
      ORDER BY lr.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) AS total
      FROM leave_requests lr
      JOIN employees e ON e.id = lr.employee_id
      ${whereClause}
    `;

    const [rows] = await this.db.query(sql, [...params, limit, offset], "LeaveRepository.findRequestsList");
    const [countRows] = await this.db.query(countSql, params, "LeaveRepository.countRequestsList");

    return {
      items: rows.map((r) => this.toCamelCase(r)),
      total: Number(countRows[0]?.total || 0)
    };
  }

  /**
   * Finds all approved leaves in a given year for company calendar.
   * @param {number} companyId
   * @param {number} year
   * @returns {Promise<Array<object>>}
   */
  async findCalendarLeaves(companyId, year) {
    const sql = `
      SELECT 
        lr.id, lr.employee_id, e.first_name, e.last_name,
        lr.start_date, lr.end_date, lr.days, lt.name AS leave_type_name
      FROM leave_requests lr
      JOIN employees e ON e.id = lr.employee_id
      JOIN leave_types lt ON lt.id = lr.leave_type_id
      WHERE e.company_id = ? AND lr.status = 'approved'
        AND (YEAR(lr.start_date) = ? OR YEAR(lr.end_date) = ?)
      ORDER BY lr.start_date ASC
    `;
    const [rows] = await this.db.query(sql, [companyId, year, year], "LeaveRepository.findCalendarLeaves");
    return rows.map((r) => this.toCamelCase(r));
  }
}
