/**
 * BaseController providing async error forwarding wrapper for express routes.
 */
export class BaseController {
  /**
   * Wraps an async controller handler to catch unhandled errors and forward to next().
   * @param {(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<any>} fn
   * @returns {import("express").RequestHandler}
   */
  handle(fn) {
    return (req, res, next) => {
      Promise.resolve(fn.call(this, req, res, next)).catch(next);
    };
  }
}
