import type { ErrorResponse } from './types.js';

export class ApiError extends Error {
  readonly statusCode: number;
  readonly errorCode: string;

  constructor(statusCode: number, errorCode: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

/** Convert unknown errors into a stable API error payload. */
export function toErrorResponse(error: unknown): {
  statusCode: number;
  body: ErrorResponse;
} {
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      body: {
        error: error.errorCode,
        message: error.message,
      },
    };
  }

  return {
    statusCode: 500,
    body: {
      error: 'internal_error',
      message: 'Unexpected backend error',
    },
  };
}
