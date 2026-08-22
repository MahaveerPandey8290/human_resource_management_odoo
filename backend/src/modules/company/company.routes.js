/**
 * @file company.routes.js
 * Express routing definitions for departments and holidays.
 */

import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authorize } from "../../middleware/authorize.js";
import { UserRole } from "../../core/Enums.js";
import { createDepartmentSchema, createHolidaySchema, getHolidaysSchema } from "./company.schemas.js";

/**
 * Creates company router with injected controller.
 * @param {import("./CompanyController.js").CompanyController} companyController
 * @returns {{ departmentRouter: Router, holidayRouter: Router }}
 */
export function createCompanyRouters(companyController) {
  const departmentRouter = Router();
  departmentRouter.get("/", companyController.getDepartments);
  departmentRouter.post("/", authorize(UserRole.ADMIN, UserRole.HR), validate(createDepartmentSchema), companyController.createDepartment);

  const holidayRouter = Router();
  holidayRouter.get("/", validate(getHolidaysSchema), companyController.getHolidays);
  holidayRouter.post("/", authorize(UserRole.ADMIN, UserRole.HR), validate(createHolidaySchema), companyController.createHoliday);

  return { departmentRouter, holidayRouter };
}
