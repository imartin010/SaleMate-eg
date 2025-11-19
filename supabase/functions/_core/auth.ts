/**
 * Authentication Utilities
 * 
 * Helper functions for authentication in Edge Functions
 * 
 * @module _core/auth
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ApiError, ErrorCodes } from './errors.ts';

/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    throw new ApiError('Missing authorization header', ErrorCodes.UNAUTHORIZED, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new ApiError('Invalid or expired token', ErrorCodes.UNAUTHORIZED, 401);
  }

  return { user, supabase };
}

/**
 * Require specific role
 */
export async function requireRole(req: Request, allowedRoles: string[]) {
  const { user, supabase } = await getAuthenticatedUser(req);

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !allowedRoles.includes(profile.role)) {
    throw new ApiError(
      'Insufficient permissions',
      ErrorCodes.FORBIDDEN,
      403,
      { required: allowedRoles, actual: profile?.role }
    );
  }

  return { user, profile, supabase };
}

