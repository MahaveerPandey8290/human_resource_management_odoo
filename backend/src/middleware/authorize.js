import { ForbiddenError } from "../core/AppError.js";
import { ErrorCodes } from "../core/ErrorCodes.js";

/**
 * Role-based authorization middleware factory.
 * @param {...string} allowedRoles
 * @returns {import("express").RequestHandler}
 */
export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user || !req.user.role) {
      return next(new ForbiddenError("Access denied: Unauthenticated context", ErrorCodes.FORBIDDEN));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError("Access denied: Insufficient permissions", ErrorCodes.FORBIDDEN));
    }

    next();
  };
}
