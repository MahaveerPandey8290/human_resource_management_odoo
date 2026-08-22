import { randomUUID } from "crypto";

/**
 * Middleware to generate or forward correlation requestId.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export function requestIdMiddleware(req, res, next) {
  const id = req.header("X-Request-Id") || randomUUID();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}
