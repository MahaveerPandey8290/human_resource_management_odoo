/**
 * @file LeaveController.js
 * Controller handling leave applications, approvals, balance queries, and calendar visualization.
 */

import { BaseController } from "../../core/BaseController.js";
import { ApiResponse } from "../../core/ApiResponse.js";

export class LeaveController extends BaseController {
  /**
   * @param {import("./LeaveService.js").LeaveService} leaveService
   */
  constructor(leaveService) {
    super();
    this.leaveService = leaveService;
  }

  /**
   * GET /leave-types
   */
  getLeaveTypes = this.handle(async (req, res) => {
    const result = await this.leaveService.getLeaveTypes(req.user.companyId);
    return ApiResponse.ok(res, result);
  });

  /**
   * GET /leaves/allocations/me
   */
  getMyAllocations = this.handle(async (req, res) => {
    const year = req.query.year ? Number(req.query.year) : undefined;
    const result = await this.leaveService.getMyAllocations(req.user.id, year);
    return ApiResponse.ok(res, result);
  });

  /**
   * POST /leaves/allocations
   */
  upsertAllocation = this.handle(async (req, res) => {
    await this.leaveService.upsertAllocation(req.body, req.user.companyId);
    return ApiResponse.ok(res, { message: "Allocation updated successfully" });
  });

  /**
   * GET /leaves
   */
  listLeaves = this.handle(async (req, res) => {
    const result = await this.leaveService.listLeaves(
      {
        scope: req.query.scope || "me",
        status: req.query.status,
        page: Number(req.query.page || 1),
        limit: Number(req.query.limit || 20)
      },
      req.user.companyId,
      req.user
    );
    return ApiResponse.ok(res, result.items, {
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 20),
      total: result.total
    });
  });

  /**
   * POST /leaves
   */
  createLeave = this.handle(async (req, res) => {
    const result = await this.leaveService.createLeaveRequest(
      req.user.id,
      req.user.companyId,
      req.body,
      req.file
    );
    return ApiResponse.created(res, result);
  });

  /**
   * PATCH /leaves/:id/status
   */
  reviewLeave = this.handle(async (req, res) => {
    const result = await this.leaveService.reviewLeaveRequest(
      req.params.id,
      req.body.status,
      req.body.reviewComment,
      req.user.id,
      req.user.companyId
    );
    return ApiResponse.ok(res, result);
  });

  /**
   * DELETE /leaves/:id
   */
  deleteLeave = this.handle(async (req, res) => {
    await this.leaveService.deleteMyPendingRequest(req.params.id, req.user.id);
    return ApiResponse.noContent(res);
  });

  /**
   * GET /leaves/calendar
   */
  getCalendar = this.handle(async (req, res) => {
    const year = req.query.year ? Number(req.query.year) : undefined;
    const result = await this.leaveService.getCalendar(req.user.companyId, year);
    return ApiResponse.ok(res, result);
  });
}
