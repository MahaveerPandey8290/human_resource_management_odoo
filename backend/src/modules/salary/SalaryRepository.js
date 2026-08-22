/**
 * @fileoverview SalaryRepository — data access for salary structures and component breakdowns.
 *
 * Salary components are a "delete and reinsert" batch operation — whenever the
 * monthly wage changes, all components are recalculated by SalaryCalculator and
 * rewritten from scratch.  There is no append-only history at this stage.
 *
 * PostgreSQL specifics:
 * - ON DUPLICATE KEY UPDATE → ON CONFLICT … DO UPDATE
 * - Bulk INSERT uses numbered $N params per row (built dynamically)
 */

import { BaseRepository } from '../../core/BaseRepository.js';

export class SalaryRepository extends BaseRepository {
  /** @param {import('../../config/database.js').Database} db */
  constructor(db) {
    super(
      db,
      'salary_structures',
      ['id', 'employee_id', 'wage_type', 'monthly_wage', 'working_days_per_week', 'break_minutes', 'effective_from', 'updated_at'],
      ['id', 'effective_from', 'monthly_wage']
    );
  }

  /**
   * Fetches the salary structure for a single employee.
   * Returns null if no structure has been set up yet.
   *
   * @param {number} employeeId
   * @returns {Promise<Record<string, any>|null>}
   */
  async findByEmployeeId(employeeId) {
    const result = await this._query(
      `SELECT * FROM salary_structures WHERE employee_id = $1 LIMIT 1`,
      [employeeId]
    );
    return result.rows.length ? this.toCamelCase(result.rows[0]) : null;
  }

  /**
   * Fetches all salary components for a structure, ordered by sort_order
   * so the frontend renders them in the correct sequence (Basic first, deductions last).
   *
   * @param {number} structureId
   * @returns {Promise<Record<string, any>[]>}
   */
  async findComponentsByStructureId(structureId) {
    const result = await this._query(
      `SELECT id, salary_structure_id, name, category, computation_type, rate, amount, sort_order
         FROM salary_components
        WHERE salary_structure_id = $1
        ORDER BY sort_order ASC`,
      [structureId]
    );
    return result.rows.map((r) => this.toCamelCase(r));
  }

  /**
   * Creates or updates a salary structure for an employee.
   * Returns the structure's ID (needed to rewrite components next).
   *
   * Using ON CONFLICT … DO UPDATE so this is idempotent — calling it twice
   * with the same employee_id just overwrites the wage, never creates a duplicate.
   *
   * @param {{ employeeId: number, monthlyWage: number, workingDaysPerWeek?: number, breakMinutes?: number, effectiveFrom?: string }} data
   * @param {import('pg').PoolClient} client - Transaction client
   * @returns {Promise<number>} The salary_structure id
   */
  async upsertStructure(data, client) {
    const result = await client.query(
      `INSERT INTO salary_structures
         (employee_id, wage_type, monthly_wage, working_days_per_week, break_minutes, effective_from)
       VALUES ($1, 'fixed', $2, $3, $4, $5)
       ON CONFLICT (employee_id)
       DO UPDATE SET
         monthly_wage          = EXCLUDED.monthly_wage,
         working_days_per_week = EXCLUDED.working_days_per_week,
         break_minutes         = EXCLUDED.break_minutes,
         effective_from        = EXCLUDED.effective_from
       RETURNING id`,
      [
        data.employeeId,
        data.monthlyWage,
        data.workingDaysPerWeek ?? 5,
        data.breakMinutes ?? 0,
        data.effectiveFrom,
      ]
    );
    return result.rows[0].id;
  }

  /**
   * Deletes all existing salary components for a structure.
   * Called right before inserting the freshly computed set.
   *
   * @param {number} structureId
   * @param {import('pg').PoolClient} client
   */
  async deleteComponents(structureId, client) {
    await client.query(
      `DELETE FROM salary_components WHERE salary_structure_id = $1`,
      [structureId]
    );
  }

  /**
   * Bulk-inserts salary components.  Each component in the array becomes one
   * VALUES row in a single INSERT statement for efficiency.
   *
   * @param {number} structureId
   * @param {Array<{ name: string, category: string, computationType: string, rate: number, amount: number, sortOrder: number }>} components
   * @param {import('pg').PoolClient} client
   */
  async insertComponents(structureId, components, client) {
    if (!components.length) return;

    // Build a flat values array and matching $N placeholders.
    // Each row has 7 columns, so the placeholders shift by 7 per row.
    const values       = [];
    const rowFragments = [];
    const COLS_PER_ROW = 7;

    for (const [i, c] of components.entries()) {
      const base = i * COLS_PER_ROW;
      rowFragments.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`
      );
      values.push(structureId, c.name, c.category, c.computationType, c.rate, c.amount, c.sortOrder);
    }

    await client.query(
      `INSERT INTO salary_components
         (salary_structure_id, name, category, computation_type, rate, amount, sort_order)
       VALUES ${rowFragments.join(', ')}`,
      values
    );
  }
}
