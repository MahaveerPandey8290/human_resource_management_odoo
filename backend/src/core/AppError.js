import { ErrorCodes } from "./ErrorCodes.js";

/**
 * Base Application Error
 */
export class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   * @param {string} code
   * @param {Array<any>} [details=[]]
   */
  constructor(message, statusCode = 500, code = ErrorCodes.INTERNAL_ERROR, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  /**
   * @param {string} [message="Resource not found"]
   * @param {Array<any>} [details=[]]
   */
  constructor(message = "Resource not found", details = []) {
    super(message, 404, ErrorCodes.NOT_FOUND, details);
  }
}

export class ValidationError extends AppError {
  /**
   * @param {string} [message="Validation failed"]
   * @param {Array<any>} [details=[]]
   */
  constructor(message = "Validation failed", details = []) {
    super(message, 422, ErrorCodes.VALIDATION_ERROR, details);
  }
}

export class UnauthorizedError extends AppError {
  /**
   * @param {string} [message="Unauthorized"]
   * @param {string} [code=ErrorCodes.UNAUTHORIZED]
   */
  constructor(message = "Unauthorized", code = ErrorCodes.UNAUTHORIZED) {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  /**
   * @param {string} [message="Forbidden access"]
   * @param {string} [code=ErrorCodes.FORBIDDEN]
   */
  constructor(message = "Forbidden access", code = ErrorCodes.FORBIDDEN) {
    super(message, 403, code);
  }
}

export class ConflictError extends AppError {
  /**
   * @param {string} [message="Conflict detected"]
   * @param {string} [code=ErrorCodes.CONFLICT]
   */
  constructor(message = "Conflict detected", code = ErrorCodes.CONFLICT) {
    super(message, 409, code);
  }
}

export class BusinessRuleError extends AppError {
  /**
   * @param {string} message
   * @param {string} [code=ErrorCodes.BUSINESS_RULE_VIOLATION]
   * @param {number} [statusCode=422]
   */
  constructor(message, code = ErrorCodes.BUSINESS_RULE_VIOLATION, statusCode = 422) {
    super(message, statusCode, code);
  }
}
