/**
 * Basic Edge Function Template
 * 
 * Use this template for simple functions that don't require authentication
 */

import { corsHeaders } from '../_core/cors.ts';
import { errorResponse, successResponse } from '../_core/errors.ts';
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
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body = await parseRequestBody<RequestBody>(req);

    // Validate required fields
    validateRequired(body, ['exampleField']);

    // Your business logic here
    const result: ResponseData = {
      message: `Received: ${body.exampleField}`,
    };

    // Return success response
    return successResponse(result);

  } catch (error) {
    // Handle errors
    return errorResponse(error);
  }
});

