import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { ErrorCodes } from "../core/ErrorCodes.js";

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ErrorCodes.RATE_LIMIT_EXCEEDED,
      message: "Too many requests, please try again later.",
      details: []
    }
  }
});

export const authRateLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ErrorCodes.RATE_LIMIT_EXCEEDED,
      message: "Too many login attempts, please try again later.",
      details: []
    }
  }
});
