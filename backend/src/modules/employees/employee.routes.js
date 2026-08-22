/**
 * @file employee.routes.js
 * Express routing definitions for employee module.
 */

import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authorize } from "../../middleware/authorize.js";
import { avatarUpload } from "../../middleware/upload.js";
import { UserRole } from "../../core/Enums.js";
import {
  listEmployeesSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  addSkillSchema,
  deleteSkillSchema
} from "./employee.schemas.js";

/**
 * Creates employee router with injected controller.
 * @param {import("./EmployeeController.js").EmployeeController} employeeController
 * @returns {Router}
 */
export function createEmployeeRouter(employeeController) {
  const router = Router();

  router.get("/", validate(listEmployeesSchema), employeeController.listEmployees);
  router.post("/", authorize(UserRole.ADMIN, UserRole.HR), validate(createEmployeeSchema), employeeController.createEmployee);
  router.get("/me", employeeController.getMe);
  router.get("/:id", employeeController.getEmployeeById);
  router.patch("/:id", validate(updateEmployeeSchema), employeeController.updateEmployee);
  router.post("/:id/avatar", avatarUpload.single("avatar"), employeeController.updateAvatar);
  router.post("/:id/skills", validate(addSkillSchema), employeeController.addSkill);
  router.delete("/:id/skills/:skillId", validate(deleteSkillSchema), employeeController.deleteSkill);

  return router;
}
