/**
 * @file auth.routes.js
 * Express routing definitions for authentication module.
 */

import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { registerCompanySchema, loginSchema, changePasswordSchema } from "./auth.schemas.js";

/**
 * Creates authentication router with injected dependencies.
 * @param {import("./AuthController.js").AuthController} authController
 * @param {import("express").RequestHandler} authRateLimiter
 * @param {import("express").RequestHandler} authenticate
 * @param {import("express").RequestHandler} requirePasswordChanged
 * @returns {Router}
 */
export function createAuthRouter(authController, authRateLimiter, authenticate, requirePasswordChanged) {
  const router = Router();

  router.post("/register-company", validate(registerCompanySchema), authController.registerCompany);
  router.post("/login", authRateLimiter, validate(loginSchema), authController.login);

  router.use(authenticate);
  router.get("/me", authController.getMe);
  router.post("/change-password", validate(changePasswordSchema), authController.changePassword);
  router.post("/logout", requirePasswordChanged, authController.logout);

  return router;
}
