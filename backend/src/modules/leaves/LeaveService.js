/**
 * @file LeaveService.js
 * Owns business logic for leave allocations, application submission, balance checks, and transactional reviews.
 * Must not touch Express req/res objects or directly execute raw SQL queries.
 */

import { BaseService } from "../../core/BaseService.js";
import { NotFoundError, ConflictError, BusinessRuleError, ValidationError } from "../../core/AppError.js";
import { ErrorCodes } from "../../core/ErrorCodes.js";
import { LeaveStatus, UserRole } from "../../core/Enums.js";
import { DateUtils } from "../../utils/DateUtils.js";

export class LeaveService extends BaseService {
  /**
   * @param {import("../../config/database.js").Database} db
   * @param {import("../../core/Logger.js").Logger} logger
   * @param {import("./LeaveRepository.js").LeaveRepository} leaveRepository
   * @param {import("../attendance/AttendanceRepository.js").AttendanceRepository} attendanceRepository
   * @param {import("../company/HolidayRepository.js").HolidayRepository} holidayRepository
   * @param {import("../salary/SalaryRepository.js").SalaryRepository} salaryRepository
   * @param {import("../../utils/Cache.js").Cache} cache
   */
  constructor(db, logger, leaveRepository, attendanceRepository, holidayRepository, salaryRepository, cache) {
    super(db, logger);
    this.leaveRepo = leaveRepository;
    this.attendanceRepo = attendanceRepository;
    this.holidayRepo = holidayRepository;
    this.salaryRepo = salaryRepository;
    this.cache = cache;
  }

  /**
   * Retrieves all leave types for a company with 60s caching.
   * @param {number} companyId
   * @returns {Promise<Array<object>>}
   */
  async getLeaveTypes(companyId) {
    const cacheKey = `leave_types_${companyId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {return cached;}

    const types = await this.leaveRepo.findAllTypes(companyId);
    this.cache.set(cacheKey, types, 60000);
    return types;
  }

  /**
   * Retrieves leave allocations for an employee.
   * @param {number} employeeId
   * @param {number} [year]
   * @returns {Promise<Array<object>>}
   */
  async getMyAllocations(employeeId, year = undefined) {
    const targetYear = year || new Date().getFullYear();
    return this.leaveRepo.findAllocationsByEmployee(employeeId, targetYear);
  }

  /**
   * Creates or updates a leave allocation.
   * @param {object} data
   * @param {number} companyId
   * @returns {Promise<void>}
   */
  async upsertAllocation(data, companyId) {
    const leaveType = await this.leaveRepo.findTypeById(data.leaveTypeId, companyId);
    if (!leaveType) {
      throw new NotFoundError("Leave type not found in company");
    }
    await this.leaveRepo.upsertAllocation(data);
  }

  /**
   * Submits a new leave request.
   * @param {number} employeeId
   * @param {number} companyId
   * @param {object} data
   * @param {import("multer").File} [file]
   * @returns {Promise<object>}
   */
  async createLeaveRequest(employeeId, companyId, data, file) {
    if (data.endDate < data.startDate) {
      throw new ValidationError("End date cannot be earlier than start date");
    }

    const leaveType = await this.leaveRepo.findTypeById(data.leaveTypeId, companyId);
    if (!leaveType) {
      throw new NotFoundError("Selected leave type does not exist");
    }

    if (leaveType.requiresAttachment && !file) {
      throw new ValidationError("Attachment is required for this leave type", [{
        field: "attachment",
        code: ErrorCodes.VALIDATION_ERROR,
        message: "Medical or proof attachment is required"
      }]);
    }

    const holidays = await this.holidayRepo.findHolidaysBetween(companyId, data.startDate, data.endDate);
    const holidayDates = holidays.map((h) => h.holidayDate);

    const salaryStructure = await this.salaryRepo.findByEmployeeId(employeeId);
    const workingDaysPerWeek = salaryStructure ? salaryStructure.workingDaysPerWeek : 5;

    const days = DateUtils.calculateWorkingDaysInRange(data.startDate, data.endDate, holidayDates, workingDaysPerWeek);
    if (days <= 0) {
      throw new BusinessRuleError("Selected date range contains no working days", ErrorCodes.BUSINESS_RULE_VIOLATION);
    }

    const overlaps = await this.leaveRepo.findOverlappingRequests(employeeId, data.startDate, data.endDate);
    if (overlaps.length > 0) {
      throw new BusinessRuleError("Overlapping leave request already exists", ErrorCodes.OVERLAPPING_LEAVE);
    }

    const requestYear = new Date(data.startDate).getFullYear();
    if (leaveType.isPaid) {
      const allocations = await this.leaveRepo.findAllocationsByEmployee(employeeId, requestYear);
      const alloc = allocations.find((a) => a.leaveTypeId === data.leaveTypeId);
      if (!alloc || (Number(alloc.usedDays) + days > Number(alloc.allocatedDays))) {
        throw new BusinessRuleError("Insufficient leave balance", ErrorCodes.INSUFFICIENT_LEAVE_BALANCE);
      }
    }

    const attachmentUrl = file ? `/uploads/${file.filename}` : null;
    const insertId = await this.leaveRepo.insert({
      employeeId,
      leaveTypeId: data.leaveTypeId,
      startDate: data.startDate,
      endDate: data.endDate,
      days,
      reason: data.reason || null,
      attachmentUrl,
      status: LeaveStatus.PENDING
    });

    return this.leaveRepo.findById(insertId);
  }

  /**
   * Reviews a leave request atomically with concurrency locking.
   * @param {number} requestId
   * @param {string} status 'approved' | 'rejected'
   * @param {string} [comment]
   * @param {number} reviewerId
   * @param {number} companyId
   * @returns {Promise<object>}
   */
  async reviewLeaveRequest(requestId, status, comment, reviewerId, companyId) {
    return this.withTransaction(async (conn) => {
      const request = await this.leaveRepo.lockRequestForReview(requestId, conn);
      if (!request) {
        throw new NotFoundError("Leave request not found");
      }

      if (request.status !== LeaveStatus.PENDING) {
        throw new ConflictError("Leave request has already been reviewed", ErrorCodes.ALREADY_REVIEWED);
      }

      await this.leaveRepo.updateRequestStatus(requestId, status, reviewerId, comment, conn);

      if (status === LeaveStatus.APPROVED) {
        const leaveType = await this.leaveRepo.findTypeById(request.leaveTypeId, companyId, conn);
        const reqYear = new Date(request.startDate).getFullYear();

        if (leaveType && leaveType.isPaid) {
          const alloc = await this.leaveRepo.findAllocationForUpdate(request.employeeId, request.leaveTypeId, reqYear, conn);
          if (!alloc) {
            throw new BusinessRuleError("No leave allocation found for this year", ErrorCodes.INSUFFICIENT_LEAVE_BALANCE);
          }
          const updatedUsed = Number(alloc.usedDays) + Number(request.days);
          if (updatedUsed > Number(alloc.allocatedDays)) {
            throw new BusinessRuleError("Insufficient leave balance for approval", ErrorCodes.INSUFFICIENT_LEAVE_BALANCE);
          }
          await this.leaveRepo.updateAllocationUsedDays(alloc.id, updatedUsed, conn);
        }

        // Generate date array for approved days
        const dates = [];
        const cur = new Date(request.startDate);
        const end = new Date(request.endDate);
        while (cur <= end) {
          dates.push(DateUtils.toDateString(cur));
          cur.setDate(cur.getDate() + 1);
        }
        await this.attendanceRepo.upsertLeaveDays(request.employeeId, dates, conn);

        // Record audit log
        await conn.query(
          `INSERT INTO audit_logs (actor_employee_id, action, entity, entity_id, meta) VALUES ($1, 'APPROVE_LEAVE', 'leave_requests', $2, $3)`,
          [reviewerId, requestId, JSON.stringify({ days: request.days, employeeId: request.employeeId })]
        );
      }

      return this.leaveRepo.findById(requestId, null, conn);
    });
  }

  /**
   * Deletes a pending leave request.
   * @param {number} requestId
   * @param {number} employeeId
   * @returns {Promise<void>}
   */
  async deleteMyPendingRequest(requestId, employeeId) {
    const deleted = await this.leaveRepo.deletePendingRequest(requestId, employeeId);
    if (!deleted) {
      throw new BusinessRuleError("Cannot delete leave request (only own pending requests can be deleted)", ErrorCodes.BUSINESS_RULE_VIOLATION);
    }
  }

  /**
   * Lists leave requests based on scope.
   * @param {object} params
   * @param {number} companyId
   * @param {object} user
   * @returns {Promise<{ items: Array<object>, total: number }>}
   */
  async listLeaves({ scope, status, page, limit }, companyId, user) {
    const employeeId = scope === "me" || user.role === UserRole.EMPLOYEE ? user.id : undefined;
    return this.leaveRepo.findRequestsList({
      companyId,
      employeeId,
      status,
      page,
      limit
    });
  }

  /**
   * Retrieves company calendar leaves and holidays.
   * @param {number} companyId
   * @param {number} [year]
   * @returns {Promise<{ leaves: Array<object>, holidays: Array<object> }>}
   */
  async getCalendar(companyId, year) {
    const targetYear = year || new Date().getFullYear();
    const leaves = await this.leaveRepo.findCalendarLeaves(companyId, targetYear);
    const holidays = await this.holidayRepo.findByCompanyAndYear(companyId, targetYear);
    return { leaves, holidays };
  }
}
