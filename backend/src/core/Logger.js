import pino from "pino";
import { env } from "../config/env.js";

/**
 * Logger wrapper around Pino providing structured JSON logging.
 */
export class Logger {
  /**
   * Initializes logger instance with transport settings based on environment.
   */
  constructor() {
    const isDev = env.NODE_ENV === "development";
    this.logger = pino({
      level: isDev ? "debug" : "info",
      timestamp: pino.stdTimeFunctions.isoTime,
      transport: isDev
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname"
            }
          }
        : undefined
    });
  }

  /**
   * Creates a child logger with contextual bindings (e.g. requestId, userId).
   * @param {Record<string, any>} bindings
   * @returns {pino.Logger}
   */
  child(bindings) {
    return this.logger.child(bindings);
  }

  /**
   * Log info message
   * @param {string|object} msgOrObj
   * @param {string} [msg]
   */
  info(msgOrObj, msg) {
    this.logger.info(msgOrObj, msg);
  }

  /**
   * Log warn message
   * @param {string|object} msgOrObj
   * @param {string} [msg]
   */
  warn(msgOrObj, msg) {
    this.logger.warn(msgOrObj, msg);
  }

  /**
   * Log error message
   * @param {string|object} msgOrObj
   * @param {string} [msg]
   */
  error(msgOrObj, msg) {
    this.logger.error(msgOrObj, msg);
  }

  /**
   * Log debug message
   * @param {string|object} msgOrObj
   * @param {string} [msg]
   */
  debug(msgOrObj, msg) {
    this.logger.debug(msgOrObj, msg);
  }
}
