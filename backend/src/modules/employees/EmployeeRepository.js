/**
 * @file EmployeeRepository.js
 * Owns raw SQL queries for employee records, card grids with todayStatus, and profile lookups.
 * Must not return password_hash or execute cross-company queries.
 */

import { BaseRepository } from "../../core/BaseRepository.js";

export class EmployeeRepository extends BaseRepository {
  /**
   * @param {import("../../config/database.js").Database} db
   */
  constructor(db) {
    super(
      db,
      "employees",
      [
        "id", "company_id", "login_id", "work_email", "must_change_password", "role",
        "first_name", "last_name", "phone", "avatar_url", "job_position", "department_id",
        "manager_id", "work_location", "date_of_joining", "emp_code", "dob", "gender",
        "marital_status", "nationality", "personal_email", "address", "bank_name",
        "account_number", "ifsc", "pan", "uan", "about", "job_love", "interests",
        "status", "created_at", "updated_at"
      ],
      ["id", "first_name", "date_of_joining", "created_at"]
    );
  }

  /**
   * Fetches employee cards with single-query LEFT JOIN resolved todayStatus (No N+1).
   * Priority: 1. on_leave (approved leave today) -> 2. present (checked in today) -> 3. absent
   * @param {object} params
   * @param {number} params.companyId
   * @param {string} [params.search]
   * @param {number} [params.departmentId]
   * @param {string} [params.status]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @param {string} [params.sort="id"]
   * @param {string} [params.sortOrder="DESC"]
   * @param {string} params.todayDate YYYY-MM-DD
   * @returns {Promise<{ items: Array<object>, total: number }>}
   */
  async findAllWithTodayStatus({ companyId, search, departmentId, status, page = 1, limit = 20, sort = "id", sortOrder = "DESC", todayDate }) {
    const sortCol = this.allowedSortColumns.includes(sort) ? `t.${sort}` : "t.id";
    const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    const offset = (Math.max(1, page) - 1) * limit;

    const { whereClause, params } = this._buildListFilters(companyId, search, departmentId, status);

    const sql = `
      SELECT 
        t.id, t.company_id, t.login_id, t.work_email, t.role,
        t.first_name, t.last_name, t.phone, t.avatar_url, t.job_position,
        t.department_id, d.name AS department_name,
        t.manager_id, CONCAT(m.first_name, ' ', m.last_name) AS manager_name,
        t.work_location, t.date_of_joining, t.status,
        CASE
          WHEN lr.id IS NOT NULL THEN 'on_leave'
          WHEN a.check_in IS NOT NULL THEN 'present'
          ELSE 'absent'
        END AS today_status
      FROM employees t
      LEFT JOIN departments d ON d.id = t.department_id
      LEFT JOIN employees m ON m.id = t.manager_id
      LEFT JOIN leave_requests lr ON lr.employee_id = t.id AND lr.status = 'approved' AND ? BETWEEN lr.start_date AND lr.end_date
      LEFT JOIN attendance a ON a.employee_id = t.id AND a.work_date = ?
      ${whereClause}
      ORDER BY ${sortCol} ${order}
      LIMIT ? OFFSET ?
    `;

    const countSql = `SELECT COUNT(*) AS total FROM employees t ${whereClause}`;

    const queryParams = [todayDate, todayDate, ...params, limit, offset];
    const [rows] = await this.db.query(sql, queryParams, "EmployeeRepository.findAllWithTodayStatus");
    const [countRows] = await this.db.query(countSql, params, "EmployeeRepository.countListFilters");

    return {
      items: rows.map((r) => this.toCamelCase(r)),
      total: Number(countRows[0]?.total || 0)
    };
  }

  /**
   * Retrieves next serial atomically using row-level locking.
   * @param {number} companyId
   * @param {number} joinYear
   * @param {import("mysql2/promise").Connection} conn
   * @returns {Promise<number>}
   */
  async getNextSerialAtomic(companyId, joinYear, conn) {
    const upsertSql = `
      INSERT INTO login_id_sequences (company_id, join_year, last_serial)
      VALUES (?, ?, 1)
      ON DUPLICATE KEY UPDATE last_serial = last_serial + 1
    `;
    await this.db.query(upsertSql, [companyId, joinYear], "EmployeeRepository.upsertSequence", conn);

    const selectSql = `
      SELECT last_serial FROM login_id_sequences
      WHERE company_id = ? AND join_year = ?
      FOR UPDATE
    `;
    const [rows] = await this.db.query(selectSql, [companyId, joinYear], "EmployeeRepository.lockSequence", conn);
    return Number(rows[0].last_serial);
  }

  /**
   * Retrieves company 2-character code.
   * @param {number} companyId
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<string>}
   */
  async getCompanyCode(companyId, conn = null) {
    const sql = `SELECT code FROM companies WHERE id = ? LIMIT 1`;
    const [rows] = await this.db.query(sql, [companyId], "EmployeeRepository.getCompanyCode", conn || this.activeConn);
    return rows.length ? rows[0].code : "CO";
  }

  /**
   * Updates avatar URL for an employee.
   * @param {number} id
   * @param {string} avatarUrl
   * @param {number} companyId
   * @returns {Promise<boolean>}
   */
  async updateAvatar(id, avatarUrl, companyId) {
    const sql = `UPDATE employees SET avatar_url = ? WHERE id = ? AND company_id = ?`;
    const [res] = await this.db.query(sql, [avatarUrl, id, companyId], "EmployeeRepository.updateAvatar");
    return res.affectedRows > 0;
  }

  /**
   * Builds WHERE filter conditions safely.
   * @private
   */
  _buildListFilters(companyId, search, departmentId, status) {
    const conditions = ["t.company_id = ?"];
    const params = [companyId];

    if (status) {
      conditions.push("t.status = ?");
      params.push(status);
    }
    if (departmentId) {
      conditions.push("t.department_id = ?");
      params.push(departmentId);
    }
    if (search) {
      conditions.push("(t.first_name LIKE ? OR t.last_name LIKE ? OR t.login_id LIKE ? OR t.work_email LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
      params
    };
  }
}
