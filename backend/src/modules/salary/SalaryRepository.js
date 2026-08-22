/**
 * @file SalaryRepository.js
 * Owns raw SQL queries for salary structures and salary component breakdowns.
 * Must not contain calculation formulas or HTTP handlers.
 */

import { BaseRepository } from "../../core/BaseRepository.js";

export class SalaryRepository extends BaseRepository {
  /**
   * @param {import("../../config/database.js").Database} db
   */
  constructor(db) {
    super(
      db,
      "salary_structures",
      ["id", "employee_id", "wage_type", "monthly_wage", "working_days_per_week", "break_minutes", "effective_from", "updated_at"],
      ["id", "effective_from", "monthly_wage"]
    );
  }

  /**
   * Finds salary structure by employee ID.
   * @param {number} employeeId
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<Record<string, any>|null>}
   */
  async findByEmployeeId(employeeId, conn = null) {
    const sql = `SELECT * FROM salary_structures WHERE employee_id = ? LIMIT 1`;
    const [rows] = await this.db.query(sql, [employeeId], "SalaryRepository.findByEmployeeId", conn || this.activeConn);
    return rows.length ? this.toCamelCase(rows[0]) : null;
  }

  /**
   * Retrieves salary components ordered by sort_order.
   * @param {number} structureId
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<Array<Record<string, any>>>}
   */
  async findComponentsByStructureId(structureId, conn = null) {
    const sql = `
      SELECT id, salary_structure_id, name, category, computation_type, rate, amount, sort_order
      FROM salary_components
      WHERE salary_structure_id = ?
      ORDER BY sort_order ASC
    `;
    const [rows] = await this.db.query(sql, [structureId], "SalaryRepository.findComponentsByStructureId", conn || this.activeConn);
    return rows.map((r) => this.toCamelCase(r));
  }

  /**
   * Upserts a salary structure record.
   * @param {object} data
   * @param {import("mysql2/promise").Connection} conn
   * @returns {Promise<number>}
   */
  async upsertStructure(data, conn) {
    const sql = `
      INSERT INTO salary_structures (employee_id, wage_type, monthly_wage, working_days_per_week, break_minutes, effective_from)
      VALUES (?, 'fixed', ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        monthly_wage = VALUES(monthly_wage),
        working_days_per_week = VALUES(working_days_per_week),
        break_minutes = VALUES(break_minutes),
        effective_from = VALUES(effective_from)
    `;
    await this.db.query(
      sql,
      [data.employeeId, data.monthlyWage, data.workingDaysPerWeek || 5, data.breakMinutes || 0, data.effectiveFrom],
      "SalaryRepository.upsertStructure",
      conn
    );

    const [rows] = await this.db.query(
      `SELECT id FROM salary_structures WHERE employee_id = ?`,
      [data.employeeId],
      "SalaryRepository.getStructureId",
      conn
    );
    return rows[0].id;
  }

  /**
   * Deletes all components for a structure ID.
   * @param {number} structureId
   * @param {import("mysql2/promise").Connection} conn
   * @returns {Promise<void>}
   */
  async deleteComponents(structureId, conn) {
    const sql = `DELETE FROM salary_components WHERE salary_structure_id = ?`;
    await this.db.query(sql, [structureId], "SalaryRepository.deleteComponents", conn);
  }

  /**
   * Bulk inserts salary components.
   * @param {number} structureId
   * @param {Array<object>} components
   * @param {import("mysql2/promise").Connection} conn
   * @returns {Promise<void>}
   */
  async insertComponents(structureId, components, conn) {
    if (!components.length) {return;}
    const values = [];
    const placeholders = [];

    for (const c of components) {
      placeholders.push("(?, ?, ?, ?, ?, ?, ?)");
      values.push(structureId, c.name, c.category, c.computationType, c.rate, c.amount, c.sortOrder);
    }

    const sql = `
      INSERT INTO salary_components (salary_structure_id, name, category, computation_type, rate, amount, sort_order)
      VALUES ${placeholders.join(", ")}
    `;
    await this.db.query(sql, values, "SalaryRepository.insertComponents", conn);
  }
}
