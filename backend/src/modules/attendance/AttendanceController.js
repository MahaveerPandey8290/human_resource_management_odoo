/**
 * @file AttendanceController.js
 * Controller handling check-in, check-out, monthly attendance summaries, and daily roster reporting.
 */

import { BaseController } from "../../core/BaseController.js";
import { ApiResponse } from "../../core/ApiResponse.js";

export class AttendanceController extends BaseController {
  /**
   * @param {import("./AttendanceService.js").AttendanceService} attendanceService
   */
  constructor(attendanceService) {
    super();
    this.attendanceService = attendanceService;
  }

  /**
   * GET /attendance/status
   */
  getStatus = this.handle(async (req, res) => {
    const result = await this.attendanceService.getStatus(req.user.id, req.user.companyId);
    return ApiResponse.ok(res, result);
  });

  /**
   * POST /attendance/check-in
   */
  checkIn = this.handle(async (req, res) => {
    const result = await this.attendanceService.checkIn(req.user.id, req.user.companyId);
    return ApiResponse.ok(res, result);
  });

  /**
   * POST /attendance/check-out
   */
  checkOut = this.handle(async (req, res) => {
    const result = await this.attendanceService.checkOut(req.user.id, req.user.companyId);
    return ApiResponse.ok(res, result);
  });

  /**
   * GET /attendance/me?month=YYYY-MM
   */
  getMyAttendance = this.handle(async (req, res) => {
    const result = await this.attendanceService.getMyMonthlyAttendance(req.user.id, req.user.companyId, req.query.month);
    return ApiResponse.ok(res, result);
  });

  /**
   * GET /attendance?date=YYYY-MM-DD
   */
  getDailyRoster = this.handle(async (req, res) => {
    const result = await this.attendanceService.getDailyAttendanceRoster(
      req.user.companyId,
      req.query.date,
      req.query.search,
      req.query.departmentId,
      Number(req.query.page || 1),
      Number(req.query.limit || 20)
    );
    return ApiResponse.ok(res, result.items, {
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 20),
      total: result.total
    });
  });
}
