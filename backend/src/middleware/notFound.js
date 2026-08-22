import { NotFoundError } from "../core/AppError.js";

/**
 * Handles 404 Route Not Found.
 * @param {import("express").Request} req
 * @param {import("express").Response} _res
 * @param {import("express").NextFunction} next
 */
export function notFoundHandler(req, _res, next) {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
}
