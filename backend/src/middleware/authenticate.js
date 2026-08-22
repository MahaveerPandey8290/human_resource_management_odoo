import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../core/AppError.js";
import { ErrorCodes } from "../core/ErrorCodes.js";

/**
 * Verifies JWT token and populates req.user.
 * @param {import("express").Request} req
 * @param {import("express").Response} _res
 * @param {import("express").NextFunction} next
 */
export function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Authentication token is required", ErrorCodes.UNAUTHORIZED));
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      companyId: decoded.companyId,
      mustChangePassword: Boolean(decoded.mustChangePassword)
    };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new UnauthorizedError("Authentication token has expired", ErrorCodes.UNAUTHORIZED));
    }
    return next(new UnauthorizedError("Invalid authentication token", ErrorCodes.UNAUTHORIZED));
  }
}
