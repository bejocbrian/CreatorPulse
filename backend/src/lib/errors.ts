export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly status: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(params: { message: string; status: number; code: ErrorCode; details?: unknown }) {
    super(params.message);
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
  }
}

export function badRequest(message: string, details?: unknown): AppError {
  return new AppError({ message, status: 400, code: 'VALIDATION_ERROR', details });
}

export function unauthorized(message = 'Unauthorized'): AppError {
  return new AppError({ message, status: 401, code: 'UNAUTHORIZED' });
}

export function forbidden(message = 'Forbidden'): AppError {
  return new AppError({ message, status: 403, code: 'FORBIDDEN' });
}

export function notFound(message = 'Not Found'): AppError {
  return new AppError({ message, status: 404, code: 'NOT_FOUND' });
}

export function conflict(message: string): AppError {
  return new AppError({ message, status: 409, code: 'CONFLICT' });
}
