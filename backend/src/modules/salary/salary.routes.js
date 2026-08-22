/**
 * @file salary.routes.js
 * Express routing definitions for salary and payslip module.
 */

import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authorize } from "../../middleware/authorize.js";
import { UserRole } from "../../core/Enums.js";
import { updateSalarySchema, getPayslipSchema } from "./salary.schemas.js";

/**
 * Creates salary router with injected controller.
 * @param {import("./SalaryController.js").SalaryController} salaryController
 * @returns {Router}
 */
export function createSalaryRouter(salaryController) {
  const router = Router();

  router.get("/:id/salary", authorize(UserRole.ADMIN), salaryController.getSalary);
  router.put("/:id/salary", authorize(UserRole.ADMIN), validate(updateSalarySchema), salaryController.updateSalary);
  router.get("/:id/payslip", validate(getPayslipSchema), salaryController.getPayslip);

  return router;
}
