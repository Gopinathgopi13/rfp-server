import { Prisma } from "@prisma/client";

export class HttpError extends Error {
  httpCode!: number;

  constructor(httpCode: number, message?: string) {
    super();
    Object.setPrototypeOf(this, HttpError.prototype);

    if (httpCode) this.httpCode = httpCode;
    if (message) this.message = message;

    this.stack = new Error().stack;
  }
}

/**
 * Exception for 400 HTTP error.
 */
export class BadRequestError extends HttpError {
  name = "BadRequestError";

  constructor(message?: string) {
    super(400);
    Object.setPrototypeOf(this, BadRequestError.prototype);

    if (message) this.message = message;
  }
}

/**
 * Exception for 403 HTTP error.
 */
export class ForbiddenError extends HttpError {
  name = "ForbiddenError";

  constructor(message?: string) {
    super(403);
    Object.setPrototypeOf(this, ForbiddenError.prototype);

    if (message) this.message = message;
  }
}

/**
 * Exception for 500 HTTP error.
 */
export class InternalServerError extends HttpError {
  name = "InternalServerError";

  constructor(message: string) {
    super(500);
    Object.setPrototypeOf(this, InternalServerError.prototype);

    if (message) this.message = message;
  }
}

/**
 * Exception for todo HTTP error.
 */
export class MethodNotAllowedError extends HttpError {
  name = "MethodNotAllowedError";

  constructor(message?: string) {
    super(405);
    Object.setPrototypeOf(this, MethodNotAllowedError.prototype);

    if (message) this.message = message;
  }
}

/**
 * Exception for 404 HTTP error.
 */
export class NotFoundError extends HttpError {
  name = "NotFoundError";

  constructor(message?: string) {
    super(404);
    Object.setPrototypeOf(this, NotFoundError.prototype);

    if (message) this.message = message;
  }
}

/**
 * Exception for 401 HTTP error.
 */
export class UnauthorizedError extends HttpError {
  name = "UnauthorizedError";

  constructor(message?: string) {
    super(401);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);

    if (message) this.message = message;
  }
}

/**
* Exception for 409 HTTP error.
*/
export class ConflictError extends HttpError {
  name = "ConflictError";

  constructor(message?: string) {
    super(409);
    Object.setPrototypeOf(this, ConflictError.prototype);

    if (message) this.message = message;
  }
}

export class ValidationError extends HttpError {
  name = "ValidationError";

  constructor(message?: string) {
    super(400);
    Object.setPrototypeOf(this, ValidationError.prototype);

    if (message) this.message = message;
  }
}

export function parsePrismaError(error: any): { message: string; code: string } {
  let message = 'Unknown error';
  let code = 'UNKNOWN';

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    code = error.code;

    message = error.message;

    if (error.code === 'P2002') {
      const fields = (error.meta?.target as string[])?.join(', ') || 'unknown';
      message = `Unique constraint failed on the fields: (${fields})`;
    } else if (error.code === 'P2025') {
      message = 'Record not found';
    }

  } else if (error instanceof Prisma.PrismaClientValidationError) {
    code = 'VALIDATION';
    message = 'Validation error: Invalid input data';
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    code = 'INIT';
    message = 'Prisma client initialization failed';
  } else if (error instanceof Prisma.PrismaClientRustPanicError) {
    code = 'PANIC';
    message = 'Prisma engine crashed (Rust panic)';
  } else {
    message = error.message || 'Unhandled error';
  }

  return { message, code };
}



