/**
 * @fileoverview SkillRepository — data access for employee skills and certifications.
 */

import { BaseRepository } from '../../core/BaseRepository.js';

export class SkillRepository extends BaseRepository {
  /** @param {import('../../config/database.js').Database} db */
  constructor(db) {
    super(db, 'employee_skills', ['id', 'employee_id', 'name', 'kind'], ['id', 'name']);
  }

  /**
   * Returns all skills and certifications listed on an employee's resume tab.
   *
   * @param {number} employeeId
   * @returns {Promise<Record<string, any>[]>}
   */
  async findByEmployeeId(employeeId) {
    const result = await this._query(
      `SELECT id, employee_id, name, kind
         FROM employee_skills
        WHERE employee_id = $1
        ORDER BY id ASC`,
      [employeeId]
    );
    return result.rows.map((r) => this.toCamelCase(r));
  }

  /**
   * Removes a skill entry — only if it belongs to the given employee.
   * The employee_id check prevents one employee from deleting another's skills.
   *
   * @param {number} skillId
   * @param {number} employeeId
   * @returns {Promise<boolean>}
   */
  async deleteSkill(skillId, employeeId) {
    const result = await this._query(
      `DELETE FROM employee_skills WHERE id = $1 AND employee_id = $2`,
      [skillId, employeeId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
