/**
 * @fileoverview DepartmentRepository — data access for company departments.
 */

import { BaseRepository } from '../../core/BaseRepository.js';

export class DepartmentRepository extends BaseRepository {
  /** @param {import('../../config/database.js').Database} db */
  constructor(db) {
    super(db, 'departments', ['id', 'company_id', 'name', 'created_at'], ['id', 'name']);
  }

  /**
   * Returns all departments for a company with a live headcount.
   * The COUNT is scoped to active employees only — inactive employees
   * are not shown in the card grid and shouldn't inflate the count.
   *
   * @param {number} companyId
   * @returns {Promise<Record<string, any>[]>}
   */
  async findByCompanyId(companyId) {
    const result = await this._query(
      `SELECT d.id, d.company_id, d.name, d.created_at,
              COUNT(e.id) AS employee_count
         FROM departments d
         LEFT JOIN employees e
                ON e.department_id = d.id
               AND e.status = 'active'
        WHERE d.company_id = $1
        GROUP BY d.id
        ORDER BY d.name ASC`,
      [companyId]
    );
    return result.rows.map((r) => this.toCamelCase(r));
  }
}
