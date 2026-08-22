/**
 * @file EmployeeController.js
 * Controller handling employee management, avatar uploads, profile inspection, and skills.
 */

import { BaseController } from "../../core/BaseController.js";
import { ApiResponse } from "../../core/ApiResponse.js";

export class EmployeeController extends BaseController {
  /**
   * @param {import("./EmployeeService.js").EmployeeService} employeeService
   */
  constructor(employeeService) {
    super();
    this.employeeService = employeeService;
  }

  /**
   * GET /employees
   */
  listEmployees = this.handle(async (req, res) => {
    const result = await this.employeeService.listEmployees(req.query, req.user.companyId);
    return ApiResponse.ok(res, result.items, {
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 20),
      total: result.total
    });
  });

  /**
   * POST /employees
   */
  createEmployee = this.handle(async (req, res) => {
    const result = await this.employeeService.createEmployee(req.body, req.user.companyId);
    return ApiResponse.created(res, result);
  });

  /**
   * GET /employees/me
   */
  getMe = this.handle(async (req, res) => {
    const result = await this.employeeService.getEmployeeById(req.user.id, req.user.companyId, req.user);
    return ApiResponse.ok(res, result);
  });

  /**
   * GET /employees/:id
   */
  getEmployeeById = this.handle(async (req, res) => {
    const result = await this.employeeService.getEmployeeById(req.params.id, req.user.companyId, req.user);
    return ApiResponse.ok(res, result);
  });

  /**
   * PATCH /employees/:id
   */
  updateEmployee = this.handle(async (req, res) => {
    const result = await this.employeeService.updateEmployee(req.params.id, req.body, req.user.companyId, req.user);
    return ApiResponse.ok(res, result);
  });

  /**
   * POST /employees/:id/avatar
   */
  updateAvatar = this.handle(async (req, res) => {
    const avatarUrl = `/uploads/${req.file.filename}`;
    const result = await this.employeeService.updateAvatar(req.params.id, avatarUrl, req.user.companyId, req.user);
    return ApiResponse.ok(res, result);
  });

  /**
   * POST /employees/:id/skills
   */
  addSkill = this.handle(async (req, res) => {
    const result = await this.employeeService.addSkill(req.params.id, req.body, req.user.companyId, req.user);
    return ApiResponse.created(res, result);
  });

  /**
   * DELETE /employees/:id/skills/:skillId
   */
  deleteSkill = this.handle(async (req, res) => {
    await this.employeeService.deleteSkill(req.params.id, req.params.skillId, req.user.companyId, req.user);
    return ApiResponse.noContent(res);
  });
}
