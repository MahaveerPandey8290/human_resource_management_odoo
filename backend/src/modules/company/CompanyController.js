/**
 * @file CompanyController.js
 * Controller handling company departments and holiday endpoints.
 */

import { BaseController } from "../../core/BaseController.js";
import { ApiResponse } from "../../core/ApiResponse.js";

export class CompanyController extends BaseController {
  /**
   * @param {import("./CompanyService.js").CompanyService} companyService
   */
  constructor(companyService) {
    super();
    this.companyService = companyService;
  }

  /**
   * GET /departments
   */
  getDepartments = this.handle(async (req, res) => {
    const result = await this.companyService.getDepartments(req.user.companyId);
    return ApiResponse.ok(res, result);
  });

  /**
   * POST /departments
   */
  createDepartment = this.handle(async (req, res) => {
    const result = await this.companyService.createDepartment(req.user.companyId, req.body.name);
    return ApiResponse.created(res, result);
  });

  /**
   * GET /holidays
   */
  getHolidays = this.handle(async (req, res) => {
    const year = req.query.year ? Number(req.query.year) : undefined;
    const result = await this.companyService.getHolidays(req.user.companyId, year);
    return ApiResponse.ok(res, result);
  });

  /**
   * POST /holidays
   */
  createHoliday = this.handle(async (req, res) => {
    const { holidayDate, name } = req.body;
    const result = await this.companyService.createHoliday(req.user.companyId, holidayDate, name);
    return ApiResponse.created(res, result);
  });
}
