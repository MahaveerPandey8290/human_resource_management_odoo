/**
 * @file SkillRepository.js
 * Owns raw SQL operations on employee skills and certifications.
 * Must not contain business logic or HTTP handling.
 */

import { BaseRepository } from "../../core/BaseRepository.js";

export class SkillRepository extends BaseRepository {
  /**
   * @param {import("../../config/database.js").Database} db
   */
  constructor(db) {
    super(db, "employee_skills", ["id", "employee_id", "name", "kind"], ["id", "name"]);
  }

  /**
   * Finds all skills and certifications for an employee.
   * @param {number} employeeId
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<Array<Record<string, any>>>}
   */
  async findByEmployeeId(employeeId, conn = null) {
    const sql = `SELECT id, employee_id, name, kind FROM employee_skills WHERE employee_id = ? ORDER BY id ASC`;
    const [rows] = await this.db.query(sql, [employeeId], "SkillRepository.findByEmployeeId", conn || this.activeConn);
    return rows.map((r) => this.toCamelCase(r));
  }

  /**
   * Deletes a specific skill belonging to an employee.
   * @param {number} skillId
   * @param {number} employeeId
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<boolean>}
   */
  async deleteSkill(skillId, employeeId, conn = null) {
    const sql = `DELETE FROM employee_skills WHERE id = ? AND employee_id = ?`;
    const [result] = await this.db.query(sql, [skillId, employeeId], "SkillRepository.deleteSkill", conn || this.activeConn);
    return result.affectedRows > 0;
  }
}
