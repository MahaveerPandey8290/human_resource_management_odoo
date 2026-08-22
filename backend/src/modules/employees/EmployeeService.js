/**
 * @file EmployeeService.js
 * Owns business logic for employee management, Login ID generation, password hashing, and profile updates.
 * Must not contain raw SQL or HTTP response formatting.
 */

import bcrypt from "bcrypt";
import { BaseService } from "../../core/BaseService.js";
import { NotFoundError, ForbiddenError } from "../../core/AppError.js";
import { UserRole } from "../../core/Enums.js";
import { env } from "../../config/env.js";
import { LoginIdGenerator } from "../../utils/LoginIdGenerator.js";
import { PasswordGenerator } from "../../utils/PasswordGenerator.js";
import { DateUtils } from "../../utils/DateUtils.js";

export class EmployeeService extends BaseService {
  /**
   * @param {import("../../config/database.js").Database} db
   * @param {import("../../core/Logger.js").Logger} logger
   * @param {import("./EmployeeRepository.js").EmployeeRepository} employeeRepository
   * @param {import("./SkillRepository.js").SkillRepository} skillRepository
   * @param {import("../leaves/LeaveRepository.js").LeaveRepository} leaveRepository
   */
  constructor(db, logger, employeeRepository, skillRepository, leaveRepository) {
    super(db, logger);
    this.employeeRepo = employeeRepository;
    this.skillRepo = skillRepository;
    this.leaveRepo = leaveRepository;
  }

  /**
   * Lists employees with card todayStatus resolved in a single query.
   * @param {object} query
   * @param {number} companyId
   * @returns {Promise<{ items: Array<object>, total: number }>}
   */
  async listEmployees(query, companyId) {
    const todayDate = DateUtils.toDateString(new Date());
    return this.employeeRepo.findAllWithTodayStatus({
      companyId,
      search: query.search,
      departmentId: query.departmentId,
      status: query.status,
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      sortOrder: query.sortOrder,
      todayDate
    });
  }

  /**
   * Creates a new employee with generated Login ID and temporary password.
   * @param {object} data
   * @param {number} companyId
   * @returns {Promise<{ employee: object, tempPassword: string }>}
   */
  async createEmployee(data, companyId) {
    const tempPassword = PasswordGenerator.generate(12);
    const passwordHash = await bcrypt.hash(tempPassword, env.BCRYPT_ROUNDS);
    const joinYear = new Date(data.dateOfJoining).getFullYear();

    const created = await this.withTransaction(async (conn) => {
      const companyCode = await this.employeeRepo.getCompanyCode(companyId, conn);
      const serial = await this.employeeRepo.getNextSerialAtomic(companyId, joinYear, conn);
      const loginId = LoginIdGenerator.format(companyCode, data.firstName, data.lastName, joinYear, serial);

      const employeeId = await this.employeeRepo.insert({
        ...data,
        companyId,
        loginId,
        passwordHash,
        mustChangePassword: 1,
        status: "active"
      }, conn);

      // Auto-allocate default leave days for the employee
      const leaveTypes = await this.leaveRepo.findAllTypes(companyId, conn);
      for (const lt of leaveTypes) {
        await this.leaveRepo.upsertAllocation({
          employeeId,
          leaveTypeId: lt.id,
          year: joinYear,
          allocatedDays: lt.defaultDays,
          usedDays: 0.0
        }, conn);
      }

      const employee = await this.employeeRepo.findById(employeeId, companyId, conn);
      return { employee, tempPassword };
    });

    return created;
  }

  /**
   * Retrieves profile details and skills for an employee.
   * @param {number} id
   * @param {number} companyId
   * @param {object} [_requesterUser]
   * @returns {Promise<object>}
   */
  async getEmployeeById(id, companyId, _requesterUser = undefined) {
    const employee = await this.employeeRepo.findById(id, companyId);
    if (!employee) {
      throw new NotFoundError("Employee profile not found");
    }

    const skills = await this.skillRepo.findByEmployeeId(id);
    return { ...employee, skills };
  }

  /**
   * Updates employee profile with self-service field restrictions.
   * @param {number} id
   * @param {object} data
   * @param {number} companyId
   * @param {object} requesterUser
   * @returns {Promise<object>}
   */
  async updateEmployee(id, data, companyId, requesterUser) {
    const existing = await this.employeeRepo.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError("Employee not found");
    }

    let payload = data;
    if (requesterUser.role === UserRole.EMPLOYEE) {
      if (requesterUser.id !== Number(id)) {
        throw new ForbiddenError("Employees can only update their own profile");
      }
      payload = {
        phone: data.phone,
        address: data.address,
        personalEmail: data.personalEmail,
        about: data.about,
        jobLove: data.jobLove,
        interests: data.interests
      };
    }

    await this.employeeRepo.updateById(id, payload, companyId);
    return this.employeeRepo.findById(id, companyId);
  }

  /**
   * Updates employee avatar URL.
   * @param {number} id
   * @param {string} avatarUrl
   * @param {number} companyId
   * @param {object} requesterUser
   * @returns {Promise<object>}
   */
  async updateAvatar(id, avatarUrl, companyId, requesterUser) {
    if (requesterUser.role === UserRole.EMPLOYEE && requesterUser.id !== Number(id)) {
      throw new ForbiddenError("Cannot change avatar of other employees");
    }
    await this.employeeRepo.updateAvatar(id, avatarUrl, companyId);
    return this.employeeRepo.findById(id, companyId);
  }

  /**
   * Adds a skill or certification to an employee.
   * @param {number} employeeId
   * @param {object} skillData
   * @param {number} _companyId
   * @param {object} requesterUser
   * @returns {Promise<object>}
   */
  async addSkill(employeeId, skillData, _companyId, requesterUser) {
    if (requesterUser.role === UserRole.EMPLOYEE && requesterUser.id !== Number(employeeId)) {
      throw new ForbiddenError("Cannot modify skills for other employees");
    }
    const skillId = await this.skillRepo.insert({ employeeId, ...skillData });
    return this.skillRepo.findById(skillId);
  }

  /**
   * Deletes a skill or certification.
   * @param {number} employeeId
   * @param {number} skillId
   * @param {number} _companyId
   * @param {object} requesterUser
   * @returns {Promise<void>}
   */
  async deleteSkill(employeeId, skillId, _companyId, requesterUser) {
    if (requesterUser.role === UserRole.EMPLOYEE && requesterUser.id !== Number(employeeId)) {
      throw new ForbiddenError("Cannot delete skills for other employees");
    }
    const deleted = await this.skillRepo.deleteSkill(skillId, employeeId);
    if (!deleted) {
      throw new NotFoundError("Skill not found");
    }
  }
}
