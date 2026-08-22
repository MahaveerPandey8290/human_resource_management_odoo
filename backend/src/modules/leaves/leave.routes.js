/**
 * @file leave.routes.js
 * Express routing definitions for leave management module.
 */

import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authorize } from "../../middleware/authorize.js";
import { leaveAttachmentUpload } from "../../middleware/upload.js";
import { UserRole } from "../../core/Enums.js";
import {
  createLeaveRequestSchema,
  reviewLeaveRequestSchema,
  listLeavesSchema,
  createAllocationSchema,
  getCalendarSchema
} from "./leave.schemas.js";

/**
 * Creates leave router with injected controller.
 * @param {import("./LeaveController.js").LeaveController} leaveController
 * @returns {Router}
 */
export function createLeaveRouter(leaveController) {
  const router = Router();

  router.get("/types", leaveController.getLeaveTypes);
  router.get("/allocations/me", leaveController.getMyAllocations);
  router.post("/allocations", authorize(UserRole.ADMIN, UserRole.HR), validate(createAllocationSchema), leaveController.upsertAllocation);
  router.get("/calendar", validate(getCalendarSchema), leaveController.getCalendar);
  router.get("/", validate(listLeavesSchema), leaveController.listLeaves);
  router.post("/", leaveAttachmentUpload.single("attachment"), validate(createLeaveRequestSchema), leaveController.createLeave);
  router.patch("/:id/status", authorize(UserRole.ADMIN, UserRole.HR), validate(reviewLeaveRequestSchema), leaveController.reviewLeave);
  router.delete("/:id", leaveController.deleteLeave);

  return router;
}
