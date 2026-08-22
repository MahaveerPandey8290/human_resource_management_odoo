/**
 * @file app.js
 * Express application configuration, security middleware, and route mounting.
 */

import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import path from "path";
import { pinoHttp } from "pino-http";

import { env } from "./config/env.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { globalRateLimiter } from "./middleware/rateLimiter.js";
import { authenticate } from "./middleware/authenticate.js";
import { requirePasswordChanged } from "./middleware/requirePasswordChanged.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

/**
 * Creates and configures Express application.
 * @param {ReturnType<typeof import("./container.js").buildContainer>} container
 * @returns {import("express").Express}
 */
export function createApp(container) {
  const app = express();

  // Security & Optimization Middlewares
  app.use(helmet());
  const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
          callback(null, true);
        } else {
          callback(new Error("CORS origin not allowed"));
        }
      },
      credentials: true
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Correlation & Request Context
  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger: container.logger.logger,
      genReqId: (req) => req.id,
      customLogLevel: (_req, res, err) => {
        if (res.statusCode >= 500 || err) {return "error";}
        if (res.statusCode >= 400) {return "warn";}
        return "info";
      }
    })
  );

  // Rate Limiting
  app.use(globalRateLimiter);

  // Static uploads serving
  app.use("/uploads", express.static(path.resolve(env.UPLOAD_DIR)));

  // Health check endpoint (both /health and /api/health)
  const healthHandler = async (_req, res) => {
    try {
      const result = await container.db.query('SELECT 1 AS ping');
      const isDbOk = result.rows[0]?.ping === 1;
      const poolStats = container.db.stats();

      res.status(200).json({
        success: true,
        data: {
          status: isDbOk ? 'UP' : 'DOWN',
          uptimeSeconds: Math.floor(process.uptime()),
          version: '1.0.0',
          database: {
            status: isDbOk ? 'CONNECTED' : 'DISCONNECTED',
            pool: poolStats,
          },
        },
        requestId: res.req.id,
      });
    } catch (err) {
      res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Database connection failed',
          details: [err.message],
        },
        requestId: res.req.id,
      });
    }
  };

  app.get("/health", healthHandler);
  app.get("/api/health", healthHandler);

  // API Router Tree under /api
  const apiRouter = express.Router();

  // Public / Auth routes
  apiRouter.use("/auth", container.authRouter);

  // Protected routes mounted explicitly
  apiRouter.use("/employees", authenticate, requirePasswordChanged, container.employeeRouter);
  apiRouter.use("/employees", authenticate, requirePasswordChanged, container.salaryRouter);
  apiRouter.use("/attendance", authenticate, requirePasswordChanged, container.attendanceRouter);
  apiRouter.use("/leaves", authenticate, requirePasswordChanged, container.leaveRouter);
  apiRouter.get("/leave-types", authenticate, requirePasswordChanged, container.controllers.leaveController.getLeaveTypes);
  apiRouter.use("/departments", authenticate, requirePasswordChanged, container.departmentRouter);
  apiRouter.use("/holidays", authenticate, requirePasswordChanged, container.holidayRouter);

  app.use("/api", apiRouter);

  // 404 and Global Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
