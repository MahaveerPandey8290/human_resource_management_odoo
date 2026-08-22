import { ValidationError } from "../core/AppError.js";

/**
 * Validates request body, query, and params against Zod schema or schema map.
 * @param {import("zod").ZodSchema | { body?: import("zod").ZodSchema, query?: import("zod").ZodSchema, params?: import("zod").ZodSchema }} schemaOrSchemas
 * @returns {import("express").RequestHandler}
 */
export function validate(schemaOrSchemas) {
  return (req, _res, next) => {
    if (schemaOrSchemas && typeof schemaOrSchemas.safeParse === "function") {
      const result = schemaOrSchemas.safeParse({
        body: req.body,
        query: req.query,
        params: req.params
      });

      if (!result.success) {
        const details = result.error.errors.map((e) => ({
          location: String(e.path[0] || "body"),
          path: e.path.slice(1).join(".") || e.path.join("."),
          message: e.message
        }));
        return next(new ValidationError("Request validation failed", details));
      }

      if (result.data.body !== undefined) {req.body = result.data.body;}
      if (result.data.query !== undefined) {req.query = result.data.query;}
      if (result.data.params !== undefined) {req.params = result.data.params;}
      return next();
    }

    const details = [];
    if (schemaOrSchemas.body) {
      const result = schemaOrSchemas.body.safeParse(req.body);
      if (!result.success) {
        details.push(...result.error.errors.map((e) => ({ location: "body", path: e.path.join("."), message: e.message })));
      } else {
        req.body = result.data;
      }
    }

    if (schemaOrSchemas.query) {
      const result = schemaOrSchemas.query.safeParse(req.query);
      if (!result.success) {
        details.push(...result.error.errors.map((e) => ({ location: "query", path: e.path.join("."), message: e.message })));
      } else {
        req.query = result.data;
      }
    }

    if (schemaOrSchemas.params) {
      const result = schemaOrSchemas.params.safeParse(req.params);
      if (!result.success) {
        details.push(...result.error.errors.map((e) => ({ location: "params", path: e.path.join("."), message: e.message })));
      } else {
        req.params = result.data;
      }
    }

    if (details.length > 0) {
      return next(new ValidationError("Request validation failed", details));
    }

    next();
  };
}
