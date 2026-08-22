/**
 * @file SalaryService.js
 * Owns business rules for salary structures, automated component calculations, and payslip generation.
 * Must not touch Express req/res objects or directly execute raw SQL queries.
 */

import { BaseService } from "../../core/BaseService.js";
import { NotFoundError, ForbiddenError } from "../../core/AppError.js";
import { ErrorCodes } from "../../core/ErrorCodes.js";
import { UserRole, SalaryCategory } from "../../core/Enums.js";
import { SalaryCalculator } from "../../utils/SalaryCalculator.js";

export class SalaryService extends BaseService {
  /**
   * @param {import("../../config/database.js").Database} db
   * @param {import("../../core/Logger.js").Logger} logger
   * @param {import("./SalaryRepository.js").SalaryRepository} salaryRepository
   * @param {import("../employees/EmployeeRepository.js").EmployeeRepository} employeeRepository
   * @param {import("../attendance/AttendanceService.js").AttendanceService} attendanceService
   */
  constructor(db, logger, salaryRepository, employeeRepository, attendanceService) {
    super(db, logger);
    this.salaryRepo = salaryRepository;
    this.employeeRepo = employeeRepository;
    this.attendanceService = attendanceService;
  }

  /**
   * Retrieves an employee's salary structure and breakdown (Admin only).
   * @param {number} employeeId
   * @param {object} requesterUser
   * @param {number} companyId
   * @returns {Promise<object>}
   */
  async getSalaryStructure(employeeId, requesterUser, companyId) {
    if (requesterUser.role !== UserRole.ADMIN) {
      throw new ForbiddenError("Salary structure is accessible to administrators only", ErrorCodes.FORBIDDEN);
    }

    const employee = await this.employeeRepo.findById(employeeId, companyId);
    if (!employee) {
      throw new NotFoundError("Employee not found");
    }

    const structure = await this.salaryRepo.findByEmployeeId(employeeId);
    if (!structure) {
      return { structure: null, components: [], yearlyWage: 0 };
    }

    const components = await this.salaryRepo.findComponentsByStructureId(structure.id);
    const yearlyWage = SalaryCalculator.round2(Number(structure.monthlyWage) * 12);

    return {
      structure,
      components,
      yearlyWage
    };
  }

  /**
   * Updates employee salary structure and recomputes all components in a transaction.
   * @param {number} employeeId
   * @param {object} data
   * @param {number} companyId
   * @returns {Promise<object>}
   */
  async updateSalaryStructure(employeeId, data, companyId) {
    const employee = await this.employeeRepo.findById(employeeId, companyId);
    if (!employee) {
      throw new NotFoundError("Employee not found");
    }

    const components = SalaryCalculator.computeBreakdown(data.monthlyWage);

    return this.withTransaction(async (conn) => {
      const structureId = await this.salaryRepo.upsertStructure({
        employeeId,
        monthlyWage: data.monthlyWage,
        workingDaysPerWeek: data.workingDaysPerWeek,
        breakMinutes: data.breakMinutes,
        effectiveFrom: data.effectiveFrom
      }, conn);

      await this.salaryRepo.deleteComponents(structureId, conn);
      await this.salaryRepo.insertComponents(structureId, components, conn);

      const updatedStructure = await this.salaryRepo.findById(structureId, null, conn);
      const updatedComponents = await this.salaryRepo.findComponentsByStructureId(structureId, conn);
      const yearlyWage = SalaryCalculator.round2(Number(data.monthlyWage) * 12);

      return {
        structure: updatedStructure,
        components: updatedComponents,
        yearlyWage
      };
    });
  }

  /**
   * Generates a detailed monthly payslip prorated by payableDays.
   * @param {number} employeeId
   * @param {string} [monthStr] YYYY-MM
   * @param {object} requesterUser
   * @param {number} companyId
   * @returns {Promise<object>}
   */
  async generatePayslip(employeeId, monthStr, requesterUser, companyId) {
    const isSelf = Number(requesterUser.id) === Number(employeeId);
    const isAdmin = requesterUser.role === UserRole.ADMIN;

    if (!isSelf && !isAdmin) {
      throw new ForbiddenError("You are not authorized to view this payslip", ErrorCodes.FORBIDDEN);
    }

    const employee = await this.employeeRepo.findById(employeeId, companyId);
    if (!employee) {
      throw new NotFoundError("Employee not found");
    }

    const structure = await this.salaryRepo.findByEmployeeId(employeeId);
    if (!structure) {
      throw new NotFoundError("Salary structure not defined for this employee");
    }

    const rawComponents = await this.salaryRepo.findComponentsByStructureId(structure.id);
    const attendanceData = await this.attendanceService.getMyMonthlyAttendance(employeeId, companyId, monthStr);
    const { totalWorkingDays, payableDays } = attendanceData.summary;

    const prorationRatio = totalWorkingDays > 0 ? Math.min(1.0, payableDays / totalWorkingDays) : 1.0;

    let grossEarnings = 0;
    let totalDeductions = 0;
    let employerContributions = 0;

    const computedComponents = rawComponents.map((c) => {
      let proratedAmount = Number(c.amount);
      if (c.category === SalaryCategory.EARNING) {
        proratedAmount = SalaryCalculator.round2(Number(c.amount) * prorationRatio);
        grossEarnings = SalaryCalculator.round2(grossEarnings + proratedAmount);
      } else if (c.category === SalaryCategory.DEDUCTION) {
        proratedAmount = Number(c.amount); // deductions like PT or PF computed on standard basic
        totalDeductions = SalaryCalculator.round2(totalDeductions + proratedAmount);
      } else if (c.category === SalaryCategory.EMPLOYER_CONTRIBUTION) {
        employerContributions = SalaryCalculator.round2(employerContributions + Number(c.amount));
      }

      return {
        ...c,
        standardAmount: Number(c.amount),
        earnedAmount: proratedAmount
      };
    });

    const netPay = SalaryCalculator.round2(grossEarnings - totalDeductions);

    return {
      month: monthStr || new Date().toISOString().slice(0, 7),
      employee: {
        id: employee.id,
        loginId: employee.loginId,
        name: `${employee.firstName} ${employee.lastName}`,
        jobPosition: employee.jobPosition,
        pan: employee.pan,
        bankName: employee.bankName,
        accountNumber: employee.accountNumber
      },
      attendance: attendanceData.summary,
      components: computedComponents,
      summary: {
        monthlyWage: Number(structure.monthlyWage),
        grossEarnings,
        totalDeductions,
        employerContributions,
        netPay
      }
    };
  }
}
