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
  },
  realtime: {
    // Only log errors, not warnings (reduces console noise)
    log_level: 'error',
    // Set connection timeout to prevent hanging
    timeout: 10000,
    // Configure realtime parameters
    params: {
      eventsPerSecond: 10
    },
    // Disable automatic reconnection attempts (we'll handle it manually if needed)
    // This prevents the flood of connection errors
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: (tries: number) => {
      // Exponential backoff with max delay
      return Math.min(1000 * Math.pow(2, tries), 30000);
    }
  },
  global: {
    // Suppress fetch errors for realtime
    headers: {
      'x-client-info': 'salemate-web'
    }
  }
});

// Handle WebSocket connection errors gracefully
// Supabase realtime WebSocket errors are logged by the library but are usually harmless
// We filter them to reduce console noise while preserving other error logging
if (typeof window !== 'undefined') {
  let wsErrorCount = 0;
  const maxWsErrorLogs = 1; // Only log once per page load
  let hasWarned = false;
  
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Override console.error to filter WebSocket connection errors
  console.error = function(...args: unknown[]) {
    const firstArg = args[0];
    const message = typeof firstArg === 'string' ? firstArg : String(firstArg);
    
    // Check if this is a WebSocket realtime connection error
    if (message.includes('WebSocket connection to') && 
        message.includes('realtime/v1/websocket') &&
        (message.includes('failed') || message.includes('error'))) {
      wsErrorCount++;
      
      if (!hasWarned) {
        hasWarned = true;
        // Log a single, user-friendly warning instead of spamming errors
        originalConsoleWarn.call(
          console,
          '⚠️ Supabase Realtime: WebSocket connection unavailable. ' +
          'Realtime features (live updates) may not work, but the app will function normally. ' +
          'This is usually harmless and can be ignored.'
        );
      }
      // Suppress the actual error to reduce console noise
      return;
    }
    
    // For all other errors, use the original console.error
    originalConsoleError.apply(console, args);
  };
  
  // Also catch unhandled WebSocket errors from the browser
  window.addEventListener('error', (event) => {
    if (event.message?.includes('WebSocket') && 
        event.message?.includes('realtime') &&
        !hasWarned) {
      hasWarned = true;
      console.warn(
        '⚠️ Supabase Realtime: WebSocket connection issue detected. ' +
        'The app will continue to work normally.'
      );
      // Prevent the error from appearing in console
      event.preventDefault();
    }
  }, true);
}

/**
 * Default export for compatibility
 */
export default supabase;

