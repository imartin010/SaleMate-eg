/**
 * @deprecated
 * This file is deprecated. Please import from '@/core/api/client' instead.
 * This re-export will be removed in a future version.
 */

import { supabase } from '../core/api/client';

if (import.meta.env.DEV) {
  console.warn(
    '⚠️ DEPRECATED: Importing from src/lib/supabase.ts is deprecated.\n' +
    'Please update your imports to use:\n' +
    "import { supabase } from '@/core/api/client';"
  );
}

export { supabase };
export default supabase;
