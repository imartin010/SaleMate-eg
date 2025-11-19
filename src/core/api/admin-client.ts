/**
 * Supabase Admin Client
 * 
 * This client uses the service role key to bypass Row Level Security (RLS).
 * Use ONLY for admin operations that require elevated permissions.
 * 
 * WARNING: Never expose service role key to the client in production!
 * 
 * @module core/api/admin-client
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wkxbhvckmgrmdkdkhnqo.supabase.co';

// In production, this should come from a secure backend endpoint
// For development, we're using the hardcoded service key
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndreGJodmNrbWdybWRrZGtobnFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ5ODM1NCwiZXhwIjoyMDcyMDc0MzU0fQ.8GPIkvdBEyuYAjqi_GpByGcDfmESXOBCn4M-XAaaNUg';

/**
 * Admin client that bypasses RLS
 * Use with caution - only for admin operations
 */
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Default export for compatibility
 */
export default supabaseAdmin;

