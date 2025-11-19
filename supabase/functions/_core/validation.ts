/**
 * Validation Utilities
 * 
 * Input validation helpers for Edge Functions
 * 
 * @module _core/validation
 */

import { ApiError, ErrorCodes } from './errors.ts';

/**
 * Validate required fields in request body
 */
export function validateRequired<T extends Record<string, unknown>>(
  body: T,
  requiredFields: (keyof T)[]
): void {
  const missing = requiredFields.filter(field => !body[field]);
  
  if (missing.length > 0) {
    throw new ApiError(
      `Missing required fields: ${missing.join(', ')}`,
      ErrorCodes.VALIDATION_ERROR,
      400,
      { missing }
    );
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Egyptian format)
 */
export function validatePhone(phone: string): boolean {
  // Egyptian phone: +20 followed by 10 digits, or 01 followed by 9 digits
  const phoneRegex = /^(\+20|0)?1[0125][0-9]{8}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Parse and validate JSON request body
 */
export async function parseRequestBody<T = unknown>(req: Request): Promise<T> {
  try {
    const body = await req.json();
    return body as T;
  } catch (error) {
    throw new ApiError(
      'Invalid JSON in request body',
      ErrorCodes.BAD_REQUEST,
      400,
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

