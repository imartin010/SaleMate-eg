/**
 * Authenticated Edge Function Template
 * 
 * Use this template for functions that require user authentication
 */

import { corsHeaders } from '../_core/cors.ts';
import { errorResponse, successResponse } from '../_core/errors.ts';
import { getAuthenticatedUser } from '../_core/auth.ts';
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
  userId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const { user, supabase } = await getAuthenticatedUser(req);

    // Parse request body
    const body = await parseRequestBody<RequestBody>(req);

    // Validate required fields
    validateRequired(body, ['exampleField']);

    // Your business logic here
    // You have access to:
    // - user: authenticated user object
    // - supabase: Supabase client with user's auth
    // - body: validated request data

    const result: ResponseData = {
      message: `Hello ${user.email}! Received: ${body.exampleField}`,
      userId: user.id,
    };

    // Return success response
    return successResponse(result);

  } catch (error) {
    // Handle errors
    return errorResponse(error);
  }
});

