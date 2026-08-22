/**
 * @file AuthRepository.js
 * Owns raw SQL queries for authentication, user credential retrieval, and password updates.
 * Must not contain business rules, token signing, or HTTP handling.
 */

import { BaseRepository } from "../../core/BaseRepository.js";

export class AuthRepository extends BaseRepository {
  /**
   * @param {import("../../config/database.js").Database} db
   */
  constructor(db) {
    super(
      db,
      "employees",
      [
        "id", "company_id", "login_id", "work_email", "must_change_password",
        "role", "first_name", "last_name", "phone", "avatar_url", "job_position",
        "department_id", "status", "created_at"
      ],
      ["id", "created_at", "login_id"]
    );
  }

  /**
   * Retrieves an employee including password_hash for authentication verification.
   * Internal to AuthRepository - password_hash is never returned by generic find methods.
   * @param {string} identifier Login ID or Work Email
   * @returns {Promise<Record<string, any>|null>}
   */
  async findAuthUserByIdentifier(identifier) {
    const sql = `
      SELECT id, company_id, login_id, work_email, password_hash,
             must_change_password, role, first_name, last_name, status
      FROM employees
      WHERE (login_id = ? OR work_email = ?) AND status = 'active'
      LIMIT 1
    `;
    const [rows] = await this.db.query(sql, [identifier, identifier], "AuthRepository.findAuthUserByIdentifier");
    return rows.length ? this.toCamelCase(rows[0]) : null;
  }

  /**
   * Retrieves password hash by user ID for password change verification.
   * @param {number} userId
   * @returns {Promise<string|null>}
   */
  async getPasswordHashById(userId) {
    const sql = `SELECT password_hash FROM employees WHERE id = ? LIMIT 1`;
    const [rows] = await this.db.query(sql, [userId], "AuthRepository.getPasswordHashById");
    return rows.length ? rows[0].password_hash : null;
  }

  /**
   * Updates user password and resets must_change_password flag.
   * @param {number} userId
   * @param {string} newPasswordHash
   * @returns {Promise<boolean>}
   */
  async updatePassword(userId, newPasswordHash) {
    const sql = `
      UPDATE employees
      SET password_hash = ?, must_change_password = 0, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await this.db.query(sql, [newPasswordHash, userId], "AuthRepository.updatePassword");
    return result.affectedRows > 0;
  }

  /**
   * Creates a new company record.
   * @param {object} companyData
   * @param {import("mysql2/promise").Connection} conn
   * @returns {Promise<number>}
   */
  async createCompany(companyData, conn) {
    const sql = `INSERT INTO companies (name, code, logo_url, phone) VALUES (?, ?, ?, ?)`;
    const [result] = await this.db.query(
      sql,
      [companyData.name, companyData.code, companyData.logoUrl || null, companyData.phone || null],
      "AuthRepository.createCompany",
      conn
    );
    return result.insertId;
  }

  /**
   * Initializes sequence row for newly registered company.
   * @param {number} companyId
   * @param {number} joinYear
   * @param {import("mysql2/promise").Connection} conn
   * @returns {Promise<void>}
   */
  async initializeSequence(companyId, joinYear, conn) {
    const sql = `INSERT INTO login_id_sequences (company_id, join_year, last_serial) VALUES (?, ?, 1)`;
    await this.db.query(sql, [companyId, joinYear], "AuthRepository.initializeSequence", conn);
  }
}
