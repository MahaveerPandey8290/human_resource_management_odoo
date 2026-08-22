/**
 * @file SalaryController.js
 * Controller handling salary structures, wage modifications, and payslip generation.
 */

import { BaseController } from "../../core/BaseController.js";
import { ApiResponse } from "../../core/ApiResponse.js";

export class SalaryController extends BaseController {
  /**
   * @param {import("./SalaryService.js").SalaryService} salaryService
   */
  constructor(salaryService) {
    super();
    this.salaryService = salaryService;
  }

  /**
   * GET /employees/:id/salary
   */
  getSalary = this.handle(async (req, res) => {
    const result = await this.salaryService.getSalaryStructure(req.params.id, req.user, req.user.companyId);
    return ApiResponse.ok(res, result);
  });

  /**
   * PUT /employees/:id/salary
   */
  updateSalary = this.handle(async (req, res) => {
    const result = await this.salaryService.updateSalaryStructure(req.params.id, req.body, req.user.companyId);
    return ApiResponse.ok(res, result);
  });

  /**
   * GET /employees/:id/payslip?month=YYYY-MM
   */
  getPayslip = this.handle(async (req, res) => {
    const result = await this.salaryService.generatePayslip(req.params.id, req.query.month, req.user, req.user.companyId);
    return ApiResponse.ok(res, result);
  });
}
