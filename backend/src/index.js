/**
 * @file index.js
 * Application entry point: loads configuration, builds DI container,
 * binds port, and manages graceful shutdown.
 */

import { env } from "./config/env.js";
import { buildContainer } from "./container.js";
import { createApp } from "./app.js";

const container = buildContainer();
const app = createApp(container);

const server = app.listen(env.PORT, () => {
  container.logger.info(
    { port: env.PORT, environment: env.NODE_ENV },
    `Dayflow HRMS Backend server running at http://localhost:${env.PORT}`
  );
});

// Graceful Shutdown
async function gracefulShutdown(signal) {
  container.logger.info(`Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    container.logger.info("HTTP server closed. Terminating database pool...");
    try {
      await container.db.close();
      container.logger.info("Database pool closed cleanly. Process exiting.");
      process.exit(0);
    } catch (err) {
      container.logger.error({ err }, "Error closing database pool during shutdown.");
      process.exit(1);
    }
  });

  // Force exit after 10s timeout
  setTimeout(() => {
    container.logger.error("Forced shutdown due to timeout.");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
