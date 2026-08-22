/**
 * @file AttendanceService.js
 * Owns business logic for check-in/out, work hour calculations, monthly summaries, and payable days.
 * Must not touch HTTP req/res objects or directly execute raw SQL queries.
 */

import { BaseService } from "../../core/BaseService.js";
import { ConflictError } from "../../core/AppError.js";
import { ErrorCodes } from "../../core/ErrorCodes.js";
import { DateUtils } from "../../utils/DateUtils.js";
import { AttendanceCalculator } from "../../utils/AttendanceCalculator.js";

export class AttendanceService extends BaseService {
  /**
   * @param {import("../../config/database.js").Database} db
   * @param {import("../../core/Logger.js").Logger} logger
   * @param {import("./AttendanceRepository.js").AttendanceRepository} attendanceRepository
   * @param {import("../leaves/LeaveRepository.js").LeaveRepository} leaveRepository
   * @param {import("../company/HolidayRepository.js").HolidayRepository} holidayRepository
   * @param {import("../salary/SalaryRepository.js").SalaryRepository} salaryRepository
   */
  constructor(db, logger, attendanceRepository, leaveRepository, holidayRepository, salaryRepository) {
    super(db, logger);
    this.attendanceRepo = attendanceRepository;
    this.leaveRepo = leaveRepository;
    this.holidayRepo = holidayRepository;
    this.salaryRepo = salaryRepository;
  }

  /**
   * Retrieves current systray attendance widget status for an employee.
   * @param {number} employeeId
   * @param {number} [_companyId]
   * @returns {Promise<{ checkedIn: boolean, since: string|null, todayStatus: string }>}
   */
  async getStatus(employeeId, _companyId = undefined) {
    const today = DateUtils.toDateString(new Date());
    const record = await this.attendanceRepo.findByEmployeeAndDate(employeeId, today);
    const leaveToday = await this.leaveRepo.findApprovedLeaveOnDate(employeeId, today);

    let todayStatus = "absent";
    if (leaveToday) {
      todayStatus = "on_leave";
    } else if (record && record.checkIn) {
      todayStatus = record.status || "present";
    }

    const checkedIn = Boolean(record && record.checkIn && !record.checkOut);
    return {
      checkedIn,
      since: checkedIn ? record.checkIn : null,
      todayStatus
    };
  }

  /**
   * Records employee check-in for today.
   * @param {number} employeeId
   * @param {number} companyId
   * @returns {Promise<object>}
   */
  async checkIn(employeeId, companyId) {
    const today = DateUtils.toDateString(new Date());
    const existing = await this.attendanceRepo.findByEmployeeAndDate(employeeId, today);

    if (existing && existing.checkIn) {
      throw new ConflictError("Already checked in today", ErrorCodes.ALREADY_CHECKED_IN);
    }

    const now = new Date();
    const nowStr = `${today} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    await this.attendanceRepo.recordCheckIn(employeeId, today, nowStr);

    return this.getStatus(employeeId, companyId);
  }

  /**
   * Records employee check-out and computes total working/extra hours.
   * @param {number} employeeId
   * @param {number} [_companyId]
   * @returns {Promise<object>}
   */
  async checkOut(employeeId, _companyId = undefined) {
    const today = DateUtils.toDateString(new Date());
    const record = await this.attendanceRepo.findByEmployeeAndDate(employeeId, today);

    if (!record || !record.checkIn) {
      throw new ConflictError("No active check-in found for today", ErrorCodes.NOT_CHECKED_IN);
    }

    const now = new Date();
    const nowStr = `${today} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const salaryStructure = await this.salaryRepo.findByEmployeeId(employeeId);
    const breakMinutes = salaryStructure ? salaryStructure.breakMinutes : 0;

    const { workMinutes, extraMinutes } = AttendanceCalculator.calculateHours(
      record.checkIn,
      nowStr,
      480,
      breakMinutes
    );

    await this.attendanceRepo.recordCheckOut(record.id, nowStr, workMinutes, extraMinutes);
    return this.attendanceRepo.findById(record.id);
  }

  /**
   * Retrieves month view attendance logs and summary analytics.
   * @param {number} employeeId
   * @param {number} companyId
   * @param {string} [monthStr] YYYY-MM
   * @returns {Promise<{ rows: Array<object>, summary: object }>}
   */
  async getMyMonthlyAttendance(employeeId, companyId, monthStr) {
    const targetMonth = monthStr || DateUtils.toDateString(new Date()).slice(0, 7);
    const allMonthDates = DateUtils.getMonthDates(targetMonth);
    const startDate = allMonthDates[0];
    const endDate = allMonthDates[allMonthDates.length - 1];

    const holidays = await this.holidayRepo.findHolidaysBetween(companyId, startDate, endDate);
    const holidayDates = holidays.map((h) => h.holidayDate);

    const salaryStructure = await this.salaryRepo.findByEmployeeId(employeeId);
    const workingDaysPerWeek = salaryStructure ? salaryStructure.workingDaysPerWeek : 5;

    const totalWorkingDays = DateUtils.calculateWorkingDaysInRange(startDate, endDate, holidayDates, workingDaysPerWeek);

    const rows = await this.attendanceRepo.findMonthlyRecords(employeeId, startDate, endDate);
    const aggregates = await this.attendanceRepo.getMonthlyAggregates(employeeId, startDate, endDate);

    const unpaidLeaveDays = await this.leaveRepo.countUnpaidLeaveDays(employeeId, startDate, endDate);

    // Calculate missing days (past working days with no attendance & no leave)
    const todayStr = DateUtils.toDateString(new Date());
    let missingAttendanceDays = 0;

    for (const d of allMonthDates) {
      if (d > todayStr) {continue;}
      const isWknd = DateUtils.isWeekend(d, workingDaysPerWeek);
      const isHol = holidayDates.includes(d);
      if (!isWknd && !isHol) {
        const found = rows.find((r) => r.workDate === d);
        if (!found || found.status === "absent") {
          missingAttendanceDays++;
        }
      }
    }

    const payableDays = Math.max(0, totalWorkingDays - unpaidLeaveDays - missingAttendanceDays);

    return {
      rows,
      summary: {
        daysPresent: aggregates.presentCount + aggregates.halfDayCount * 0.5,
        leavesCount: aggregates.leaveCount,
        totalWorkingDays,
        payableDays,
        totalWorkMinutes: aggregates.totalWorkMinutes,
        totalExtraMinutes: aggregates.totalExtraMinutes
      }
    };
  }

  /**
   * Retrieves daily attendance list for all company employees.
   * @param {number} companyId
   * @param {string} [dateStr]
   * @param {string} [search]
   * @param {number} [departmentId]
   * @param {number} [page=1]
   * @param {number} [limit=20]
   * @returns {Promise<{ items: Array<object>, total: number }>}
   */
  async getDailyAttendanceRoster(companyId, dateStr, search, departmentId, page = 1, limit = 20) {
    const workDate = dateStr || DateUtils.toDateString(new Date());
    return this.attendanceRepo.findDailyRoster({
      companyId,
      workDate,
      search,
      departmentId,
      page,
      limit
    });
  }
}
