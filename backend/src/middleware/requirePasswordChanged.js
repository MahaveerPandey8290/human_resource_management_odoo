import { ForbiddenError } from "../core/AppError.js";
import { ErrorCodes } from "../core/ErrorCodes.js";

/**
 * Blocks requests if user must change password, except for exempt routes.
 * @param {import("express").Request} req
 * @param {import("express").Response} _res
 * @param {import("express").NextFunction} next
 */
export function requirePasswordChanged(req, _res, next) {
  if (!req.user || !req.user.mustChangePassword) {
    return next();
  }

  const exemptPaths = ["/api/auth/me", "/api/auth/change-password", "/api/auth/logout"];
  if (exemptPaths.some((p) => req.originalUrl.startsWith(p))) {
    return next();
  }

  return next(
    new ForbiddenError(
      "Password change is required before accessing application resources",
      ErrorCodes.PASSWORD_CHANGE_REQUIRED
    )
  );
}
