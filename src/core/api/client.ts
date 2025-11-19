/**
 * Supabase Client - Single Source of Truth
 * 
 * This is the main Supabase client for the application.
 * All Supabase operations should import from this file.
 * 
 * @module core/api/client
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

// Environment variables with validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wkxbhvckmgrmdkdkhnqo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndreGJodmNrbWdybWRrZGtobnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTgzNTQsImV4cCI6MjA3MjA3NDM1NH0.Vg48-ld0anvU4OQJWf5ZlEqTKjXiHBK0A14fz0vGvU8';

// Validation and debugging
if (import.meta.env.DEV) {
  console.log('🔍 Supabase Client Initialization:', {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
    key: supabaseAnonKey ? `Set (${supabaseAnonKey.length} chars)` : 'MISSING',
    env: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'))
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = `Missing Supabase environment variables. 
  VITE_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}
  VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}
  
  Please ensure your .env file contains:
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key-here
  
  Then restart your development server.`;
  console.error(errorMsg);
  throw new Error('Missing Supabase environment variables');
}

// Validate key format
if (supabaseAnonKey && supabaseAnonKey.length < 100) {
  console.warn('⚠️ Supabase anon key seems too short. Expected JWT token format.');
}

/**
 * Main Supabase client instance
 * Use this for all authenticated user operations
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
});

/**
 * Default export for compatibility
 */
export default supabase;

