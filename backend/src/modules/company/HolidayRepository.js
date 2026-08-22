/**
 * @file HolidayRepository.js
 * Owns raw SQL queries for company holidays.
 * Must not contain HTTP logic or business rules.
 */

import { BaseRepository } from "../../core/BaseRepository.js";

export class HolidayRepository extends BaseRepository {
  /**
   * @param {import("../../config/database.js").Database} db
   */
  constructor(db) {
    super(db, "holidays", ["id", "company_id", "holiday_date", "name", "created_at"], ["id", "holiday_date", "name"]);
  }

  /**
   * Finds holidays for a company in a given year.
   * @param {number} companyId
   * @param {number} year
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<Array<Record<string, any>>>}
   */
  async findByCompanyAndYear(companyId, year, conn = null) {
    const sql = `
      SELECT id, company_id, holiday_date, name
      FROM holidays
      WHERE company_id = ? AND YEAR(holiday_date) = ?
      ORDER BY holiday_date ASC
    `;
    const [rows] = await this.db.query(sql, [companyId, year], "HolidayRepository.findByCompanyAndYear", conn || this.activeConn);
    return rows.map((r) => this.toCamelCase(r));
  }

  /**
   * Finds holidays occurring between two dates.
   * @param {number} companyId
   * @param {string} startDate
   * @param {string} endDate
   * @param {import("mysql2/promise").Connection} [conn]
   * @returns {Promise<Array<Record<string, any>>>}
   */
  async findHolidaysBetween(companyId, startDate, endDate, conn = null) {
    const sql = `
      SELECT id, company_id, holiday_date, name
      FROM holidays
      WHERE company_id = ? AND holiday_date BETWEEN ? AND ?
      ORDER BY holiday_date ASC
    `;
    const [rows] = await this.db.query(sql, [companyId, startDate, endDate], "HolidayRepository.findHolidaysBetween", conn || this.activeConn);
    return rows.map((r) => this.toCamelCase(r));
  }
}
