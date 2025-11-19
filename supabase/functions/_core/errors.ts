/**
 * Error Handling Utilities
 * 
 * Standard error handling for Edge Functions
 * 
 * @module _core/errors
 */

import { corsHeaders } from './cors.ts';

/**
 * Standard error codes
 */
export const ErrorCodes = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string = ErrorCodes.INTERNAL_ERROR,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Create error response
 */
export function errorResponse(
  error: Error | ApiError | unknown,
  defaultMessage = 'Internal server error'
): Response {
  let statusCode = 500;
  let code = ErrorCodes.INTERNAL_ERROR;
  let message = defaultMessage;
  let details: unknown = undefined;

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof Error) {
    message = error.message;
  }

  console.error('API Error:', { code, message, details });

  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      code,
      details,
    }),
    {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Create success response
 */
export function successResponse(data: unknown, statusCode = 200): Response {
  return new Response(
    JSON.stringify({
      success: true,
      ...data,
    }),
    {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

