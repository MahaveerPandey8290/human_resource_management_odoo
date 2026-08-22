/**
 * @file attendance.routes.js
 * Express routing definitions for attendance module.
 */

import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authorize } from "../../middleware/authorize.js";
import { UserRole } from "../../core/Enums.js";
import { getMonthlyAttendanceSchema, getDailyAttendanceSchema } from "./attendance.schemas.js";

/**
 * Creates attendance router with injected controller.
 * @param {import("./AttendanceController.js").AttendanceController} attendanceController
 * @returns {Router}
 */
export function createAttendanceRouter(attendanceController) {
  const router = Router();

  router.get("/status", attendanceController.getStatus);
  router.post("/check-in", attendanceController.checkIn);
  router.post("/check-out", attendanceController.checkOut);
  router.get("/me", validate(getMonthlyAttendanceSchema), attendanceController.getMyAttendance);
  router.get("/", authorize(UserRole.ADMIN, UserRole.HR), validate(getDailyAttendanceSchema), attendanceController.getDailyRoster);

  return router;
}
