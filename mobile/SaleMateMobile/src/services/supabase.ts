import {createClient} from '@supabase/supabase-js';

// TODO: Replace with your real Supabase URL and anon key.
// For security, move these to a secure config (env or native config)
const SUPABASE_URL = 'https://wkxbhvckmgrmdkdkhnqo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndreGJodmNrbWdybWRrZGtobnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTgzNTQsImV4cCI6MjA3MjA3NDM1NH0.Vg48-ld0anvU4OQJWf5ZlEqTKjXiHBK0A14fz0vGvU8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
});


