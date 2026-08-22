import { AppError } from "../core/AppError.js";
import { ErrorCodes } from "../core/ErrorCodes.js";

/**
 * Centralized application error handling middleware.
 * @param {Error} err
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} _next
 */
export function errorHandler(err, req, res, _next) {
  const requestId = req.id || req.header("X-Request-Id");
  const isAppError = err instanceof AppError;

  const statusCode = isAppError ? err.statusCode : (err.status || 500);
  const code = isAppError ? err.code : ErrorCodes.INTERNAL_ERROR;
  const message = isAppError ? err.message : (statusCode === 500 ? "An unexpected error occurred" : err.message);
  const details = isAppError && err.details ? err.details : [];

  if (req.logger) {
    req.logger.error({ err, statusCode, code, requestId }, `[ERROR] ${req.method} ${req.originalUrl} -> ${statusCode}`);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details
    },
    requestId
  });
}
