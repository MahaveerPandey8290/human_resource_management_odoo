/**
 * @file AuthController.js
 * Controller handling authentication requests and dispatching to AuthService.
 */

import { BaseController } from "../../core/BaseController.js";
import { ApiResponse } from "../../core/ApiResponse.js";

export class AuthController extends BaseController {
  /**
   * @param {import("./AuthService.js").AuthService} authService
   */
  constructor(authService) {
    super();
    this.authService = authService;
  }

  /**
   * POST /auth/register-company
   */
  registerCompany = this.handle(async (req, res) => {
    const result = await this.authService.registerCompany(req.body);
    return ApiResponse.created(res, result);
  });

  /**
   * POST /auth/login
   */
  login = this.handle(async (req, res) => {
    const { identifier, password } = req.body;
    const result = await this.authService.login(identifier, password);
    return ApiResponse.ok(res, result);
  });

  /**
   * GET /auth/me
   */
  getMe = this.handle(async (req, res) => {
    const result = await this.authService.getMe(req.user.id, req.user.companyId);
    return ApiResponse.ok(res, result);
  });

  /**
   * POST /auth/change-password
   */
  changePassword = this.handle(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await this.authService.changePassword(req.user.id, currentPassword, newPassword);
    return ApiResponse.ok(res, result);
  });

  /**
   * POST /auth/logout
   */
  logout = this.handle(async (_req, res) => {
    return ApiResponse.ok(res, { message: "Logged out successfully" });
  });
}
