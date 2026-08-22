/**
 * @fileoverview HolidayRepository — data access for company holidays.
 */

import { BaseRepository } from '../../core/BaseRepository.js';

export class HolidayRepository extends BaseRepository {
  /** @param {import('../../config/database.js').Database} db */
  constructor(db) {
    super(
      db,
      'holidays',
      ['id', 'company_id', 'holiday_date', 'name', 'created_at'],
      ['id', 'holiday_date', 'name']
    );
  }

  /**
   * Returns all holidays for a company in a specific calendar year.
   * Uses PostgreSQL's EXTRACT instead of MySQL's YEAR() function.
   *
   * @param {number} companyId
   * @param {number} year
   * @returns {Promise<Record<string, any>[]>}
   */
  async findByCompanyAndYear(companyId, year) {
    const result = await this._query(
      `SELECT id, company_id, holiday_date, name
         FROM holidays
        WHERE company_id = $1
          AND EXTRACT(YEAR FROM holiday_date) = $2
        ORDER BY holiday_date ASC`,
      [companyId, year]
    );
    return result.rows.map((r) => this.toCamelCase(r));
  }

  /**
   * Returns holidays that fall within a date range.
   * Used by the working-days calculator to skip public holidays when
   * computing leave duration.
   *
   * @param {number} companyId
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate   - YYYY-MM-DD
   * @returns {Promise<Record<string, any>[]>}
   */
  async findHolidaysBetween(companyId, startDate, endDate) {
    const result = await this._query(
      `SELECT id, company_id, holiday_date, name
         FROM holidays
        WHERE company_id = $1
          AND holiday_date BETWEEN $2 AND $3
        ORDER BY holiday_date ASC`,
      [companyId, startDate, endDate]
    );
    return result.rows.map((r) => this.toCamelCase(r));
  }
}
