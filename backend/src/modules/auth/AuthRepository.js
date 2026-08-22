/**
 * @fileoverview AuthRepository — data access for login, password management, and company creation.
 *
 * This repository is the only place in the codebase that can SELECT password_hash.
 * All other repositories inherit from BaseRepository which strips that column
 * automatically from every generic query.
 */

import { BaseRepository } from '../../core/BaseRepository.js';

export class AuthRepository extends BaseRepository {
  /** @param {import('../../config/database.js').Database} db */
  constructor(db) {
    super(
      db,
      'employees',
      [
        'id', 'company_id', 'login_id', 'work_email', 'must_change_password',
        'role', 'first_name', 'last_name', 'phone', 'avatar_url', 'job_position',
        'department_id', 'status', 'created_at',
      ],
      ['id', 'created_at', 'login_id']
    );
  }

  /**
   * Fetches an employee row including the password hash — needed only at login time.
   * The password hash is NEVER included in any other query.
   *
   * @param {string} identifier - Can be a Login ID (OIJODO20220002) or a work email.
   * @returns {Promise<Record<string, any>|null>}
   */
  async findAuthUserByIdentifier(identifier) {
    const sql = `
      SELECT id, company_id, login_id, work_email, password_hash,
             must_change_password, role, first_name, last_name, status
      FROM employees
      WHERE (login_id = $1 OR work_email = $1)
        AND status = 'active'
      LIMIT 1
    `;
    const result = await this.db.query(sql, [identifier]);
    return result.rows.length ? this.toCamelCase(result.rows[0]) : null;
  }

  /**
   * Fetches the current password hash for a user so we can verify
   * their old password before letting them set a new one.
   *
   * @param {number} userId
   * @returns {Promise<string|null>}
   */
  async getPasswordHashById(userId) {
    const result = await this.db.query(
      `SELECT password_hash FROM employees WHERE id = $1 LIMIT 1`,
      [userId]
    );
    return result.rows.length ? result.rows[0].password_hash : null;
  }

  /**
   * Saves a new bcrypt password hash and clears the first-login flag.
   *
   * @param {number} userId
   * @param {string} newPasswordHash
   * @returns {Promise<boolean>} true if the row was updated
   */
  async updatePassword(userId, newPasswordHash) {
    const result = await this.db.query(
      `UPDATE employees
          SET password_hash = $1, must_change_password = false, updated_at = NOW()
        WHERE id = $2`,
      [newPasswordHash, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Creates a new company row inside a transaction.
   * Returns the newly generated company ID.
   *
   * @param {{ name: string, code: string, logoUrl?: string, phone?: string }} companyData
   * @param {import('pg').PoolClient} client - Transaction client
   * @returns {Promise<number>}
   */
  async createCompany(companyData, client) {
    const result = await client.query(
      `INSERT INTO companies (name, code, logo_url, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [companyData.name, companyData.code, companyData.logoUrl || null, companyData.phone || null]
    );
    return result.rows[0].id;
  }

  /**
   * Seeds the initial login ID sequence row for a brand-new company.
   * Called once when a company registers for the first time.
   *
   * @param {number} companyId
   * @param {number} joinYear
   * @param {import('pg').PoolClient} client
   * @returns {Promise<void>}
   */
  async initializeSequence(companyId, joinYear, client) {
    await client.query(
      `INSERT INTO login_id_sequences (company_id, join_year, last_serial)
       VALUES ($1, $2, 1)
       ON CONFLICT (company_id, join_year) DO NOTHING`,
      [companyId, joinYear]
    );
  }
}
