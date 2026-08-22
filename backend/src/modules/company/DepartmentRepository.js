/**
 * @file DepartmentRepository.js
 * Owns raw SQL queries for company departments.
 * Must not contain HTTP logic or business rules.
 */

import { BaseRepository } from "../../core/BaseRepository.js";

export class DepartmentRepository extends BaseRepository {
  /**
   * @param {import("../../config/database.js").Database} db
   */
  constructor(db) {
    super(db, "departments", ["id", "company_id", "name", "created_at"], ["id", "name"]);
  }

  /**
   * Finds all departments for a company.
   * @param {number} companyId
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<Array<Record<string, any>>>}
   */
  async findByCompanyId(companyId, conn = null) {
    const sql = `
      SELECT d.id, d.company_id, d.name, d.created_at,
             COUNT(e.id) AS employee_count
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
      WHERE d.company_id = ?
      GROUP BY d.id
      ORDER BY d.name ASC
    `;
    const [rows] = await this.db.query(sql, [companyId], "DepartmentRepository.findByCompanyId", conn || this.activeConn);
    return rows.map((r) => this.toCamelCase(r));
  }
}
