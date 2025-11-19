/**
 * Admin Edge Function Template
 * 
 * Use this template for functions that require admin role
 */

import { corsHeaders } from '../_core/cors.ts';
import { errorResponse, successResponse } from '../_core/errors.ts';
import { requireRole } from '../_core/auth.ts';
import { parseRequestBody, validateRequired } from '../_core/validation.ts';

// Define request body type
interface RequestBody {
  // Add your request fields here
  exampleField: string;
}

// Define response type
interface ResponseData {
  // Add your response fields here
  message: string;
  adminId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Require admin role
    const { user, profile, supabase } = await requireRole(req, ['admin']);

    // Parse request body
    const body = await parseRequestBody<RequestBody>(req);

    // Validate required fields
    validateRequired(body, ['exampleField']);

    // Your business logic here
    // You have access to:
    // - user: authenticated user object
    // - profile: user profile with role
    // - supabase: Supabase client with user's auth
    // - body: validated request data

    const result: ResponseData = {
      message: `Admin ${user.email} performed action: ${body.exampleField}`,
      adminId: user.id,
    };

    // Return success response
    return successResponse(result);

  } catch (error) {
    // Handle errors
    return errorResponse(error);
  }
});

