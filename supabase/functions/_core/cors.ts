/**
 * CORS Headers Configuration
 * 
 * Standard CORS headers for all Edge Functions
 * 
 * @module _core/cors
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

