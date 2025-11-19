/**
 * @deprecated
 * This file has been moved to features/auth/store/auth.store.ts
 * Please update your imports to use:
 * import { useAuthStore } from '@/features/auth'
 */

import { useAuthStore } from '../features/auth/store/auth.store';

if (import.meta.env.DEV) {
  console.warn(
    '⚠️ DEPRECATED: Importing from src/store/auth.ts is deprecated.\n' +
    'Please update your imports:\n' +
    "import { useAuthStore } from '@/features/auth';"
  );
}

export { useAuthStore };
export default useAuthStore;
