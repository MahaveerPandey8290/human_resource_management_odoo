/**
 * @file CompanyService.js
 * Owns business logic for company departments and holidays with cache management.
 * Must not touch HTTP req/res objects or directly execute raw SQL queries.
 */

import { BaseService } from "../../core/BaseService.js";

export class CompanyService extends BaseService {
  /**
   * @param {import("../../config/database.js").Database} db
   * @param {import("../../core/Logger.js").Logger} logger
   * @param {import("./DepartmentRepository.js").DepartmentRepository} departmentRepository
   * @param {import("./HolidayRepository.js").HolidayRepository} holidayRepository
   * @param {import("../../utils/Cache.js").Cache} cache
   */
  constructor(db, logger, departmentRepository, holidayRepository, cache) {
    super(db, logger);
    this.deptRepo = departmentRepository;
    this.holidayRepo = holidayRepository;
    this.cache = cache;
  }

  /**
   * Retrieves departments for a company with 60s TTL caching.
   * @param {number} companyId
   * @returns {Promise<Array<object>>}
   */
  async getDepartments(companyId) {
    const cacheKey = `departments_${companyId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {return cached;}

    const departments = await this.deptRepo.findByCompanyId(companyId);
    this.cache.set(cacheKey, departments, 60000);
    return departments;
  }

  /**
   * Creates a new department and invalidates cache.
   * @param {number} companyId
   * @param {string} name
   * @returns {Promise<object>}
   */
  async createDepartment(companyId, name) {
    const insertId = await this.deptRepo.insert({ companyId, name });
    this.cache.invalidate(`departments_${companyId}`);
    return this.deptRepo.findById(insertId, companyId);
  }

  /**
   * Retrieves company holidays for a given year with caching.
   * @param {number} companyId
   * @param {number} [year]
   * @returns {Promise<Array<object>>}
   */
  async getHolidays(companyId, year) {
    const targetYear = year || new Date().getFullYear();
    const cacheKey = `holidays_${companyId}_${targetYear}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {return cached;}

    const holidays = await this.holidayRepo.findByCompanyAndYear(companyId, targetYear);
    this.cache.set(cacheKey, holidays, 60000);
    return holidays;
  }

  /**
   * Creates a new company holiday and invalidates cache.
   * @param {number} companyId
   * @param {string} holidayDate
   * @param {string} name
   * @returns {Promise<object>}
   */
  async createHoliday(companyId, holidayDate, name) {
    const insertId = await this.holidayRepo.insert({ companyId, holidayDate, name });
    const year = new Date(holidayDate).getFullYear();
    this.cache.invalidate(`holidays_${companyId}_${year}`);
    return this.holidayRepo.findById(insertId, companyId);
  }
}
