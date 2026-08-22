/**
 * @file AuthService.js
 * Owns business logic for authentication, JWT signing, password verification, and registration.
 * Must not touch Express req/res objects or directly execute raw SQL queries.
 */

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { BaseService } from "../../core/BaseService.js";
import { UnauthorizedError, NotFoundError } from "../../core/AppError.js";
import { ErrorCodes } from "../../core/ErrorCodes.js";
import { UserRole } from "../../core/Enums.js";
import { env } from "../../config/env.js";
import { LoginIdGenerator } from "../../utils/LoginIdGenerator.js";
import { DateUtils } from "../../utils/DateUtils.js";

export class AuthService extends BaseService {
  /**
   * @param {import("../../config/database.js").Database} db
   * @param {import("../../core/Logger.js").Logger} logger
   * @param {import("./AuthRepository.js").AuthRepository} authRepository
   * @param {import("../employees/EmployeeRepository.js").EmployeeRepository} employeeRepository
   */
  constructor(db, logger, authRepository, employeeRepository) {
    super(db, logger);
    this.authRepo = authRepository;
    this.employeeRepo = employeeRepository;
  }

  /**
   * Generates a signed JWT for the authenticated user.
   * @param {object} user
   * @param {boolean} [mustChangePassword]
   * @returns {string}
   */
  generateToken(user, mustChangePassword = undefined) {
    const payload = {
      sub: user.id,
      role: user.role,
      companyId: user.companyId,
      mustChangePassword: mustChangePassword !== undefined ? mustChangePassword : Boolean(user.mustChangePassword)
    };
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  }

  /**
   * Registers a new company with its primary admin account in an atomic transaction.
   * @param {object} data
   * @returns {Promise<{ token: string, user: object, company: object }>}
   */
  async registerCompany(data) {
    return this.withTransaction(async (conn) => {
      const code = LoginIdGenerator.deriveCompanyCode(data.companyName);
      const companyId = await this.authRepo.createCompany({
        name: data.companyName,
        code,
        logoUrl: data.logoUrl,
        phone: data.companyPhone
      }, conn);

      const joinYear = new Date().getFullYear();
      const loginId = LoginIdGenerator.format(code, data.adminFirstName, data.adminLastName, joinYear, 1);
      const passwordHash = await bcrypt.hash(data.adminPassword, env.BCRYPT_ROUNDS);

      const adminId = await this.employeeRepo.insert({
        companyId,
        loginId,
        workEmail: data.adminEmail,
        passwordHash,
        mustChangePassword: false,
        role: UserRole.ADMIN,
        firstName: data.adminFirstName,
        lastName: data.adminLastName,
        dateOfJoining: DateUtils.toDateString(new Date()),
        status: "active"
      }, conn);

      await this.authRepo.initializeSequence(companyId, joinYear, conn);

      // 1. Insert default leave types
      const ltResult = await conn.query(
        `INSERT INTO leave_types (company_id, name, is_paid, requires_attachment, default_days)
         VALUES
           ($1, 'Paid Time Off', true, false, 24.0),
           ($1, 'Sick Leave', true, true, 7.0),
           ($1, 'Unpaid Leaves', false, false, 0.0)
         RETURNING id, name, default_days`,
        [companyId]
      );

      // 2. Allocate leave balances for admin
      for (const lt of ltResult.rows) {
        await conn.query(
          `INSERT INTO leave_allocations (employee_id, leave_type_id, year, allocated_days, used_days)
           VALUES ($1, $2, $3, $4, 0.0)
           ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING`,
          [adminId, lt.id, joinYear, lt.default_days]
        );
      }

      // 3. Insert default company holidays for current year
      const defaultHolidays = [
        { date: `${joinYear}-01-14`, name: 'Kite Festival' },
        { date: `${joinYear}-01-26`, name: 'Republic Day' },
        { date: `${joinYear}-03-04`, name: 'Dhuleti' },
        { date: `${joinYear}-08-15`, name: 'Independence Day' },
        { date: `${joinYear}-08-28`, name: 'Rakhi' },
        { date: `${joinYear}-10-02`, name: 'Gandhi Jayanti' },
        { date: `${joinYear}-11-08`, name: 'Diwali' },
        { date: `${joinYear}-11-10`, name: 'New Year' },
        { date: `${joinYear}-11-11`, name: 'Bhai Duj' },
      ];

      for (const h of defaultHolidays) {
        await conn.query(
          `INSERT INTO holidays (company_id, holiday_date, name)
           VALUES ($1, $2, $3)
           ON CONFLICT (company_id, holiday_date) DO NOTHING`,
          [companyId, h.date, h.name]
        );
      }

      const user = { id: adminId, loginId, role: UserRole.ADMIN, companyId, email: data.adminEmail, mustChangePassword: false };
      const token = this.generateToken(user, false);

      return {
        token,
        user: { id: adminId, loginId, firstName: data.adminFirstName, lastName: data.adminLastName, email: data.adminEmail, role: UserRole.ADMIN },
        company: { id: companyId, name: data.companyName, code }
      };
    });
  }

  /**
   * Authenticates user using Login ID or Email.
   * @param {string} identifier
   * @param {string} password
   * @returns {Promise<{ token: string, user: object }>}
   */
  async login(identifier, password) {
    const user = await this.authRepo.findAuthUserByIdentifier(identifier);
    if (!user) {
      throw new UnauthorizedError("Invalid login credentials", ErrorCodes.UNAUTHORIZED);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid login credentials", ErrorCodes.UNAUTHORIZED);
    }

    const token = this.generateToken(user);
    const safeUser = { ...user };
    delete safeUser.passwordHash;

    return { token, user: safeUser };
  }

  /**
   * Fetches the current logged in user profile with role permissions.
   * @param {number} userId
   * @param {number} companyId
   * @returns {Promise<object>}
   */
  async getMe(userId, companyId) {
    const user = await this.employeeRepo.findById(userId, companyId);
    if (!user) {
      throw new NotFoundError("User account not found");
    }

    const permissions = this._getPermissionsForRole(user.role);
    return { ...user, permissions };
  }

  /**
   * Updates user password and generates a refreshed token.
   * @param {number} userId
   * @param {string} currentPassword
   * @param {string} newPassword
   * @returns {Promise<{ token: string }>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    const currentHash = await this.authRepo.getPasswordHashById(userId);
    if (!currentHash) {
      throw new NotFoundError("User not found");
    }

    const isMatch = await bcrypt.compare(currentPassword, currentHash);
    if (!isMatch) {
      throw new UnauthorizedError("Current password is incorrect", ErrorCodes.UNAUTHORIZED);
    }

    const newHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await this.authRepo.updatePassword(userId, newHash);

    const user = await this.employeeRepo.findById(userId);
    const token = this.generateToken(user, false);
    return { token };
  }

  /**
   * Returns domain permissions array for a role.
   * @private
   * @param {string} role
   * @returns {string[]}
   */
  _getPermissionsForRole(role) {
    if (role === UserRole.ADMIN) {
      return ["manage_all", "view_salary", "edit_salary", "manage_employees", "approve_leaves", "manage_attendance"];
    }
    if (role === UserRole.HR) {
      return ["manage_employees", "approve_leaves", "manage_attendance", "view_reports"];
    }
    return ["view_own_profile", "apply_leaves", "record_attendance", "view_own_payslip"];
  }
}
