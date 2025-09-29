// Utility to clear development data for testing
import { useAuthStore } from '../store/auth';

export function clearAllDevData() {
  const { user } = useAuthStore.getState();
  
  if (user && import.meta.env.DEV) {
    localStorage.removeItem(`dev-leads-${user.id}`);
    localStorage.removeItem(`dev-purchases-${user.id}`);
    console.log('🗑️ Cleared all development data');
    
    // Reload the page to refresh all components
    window.location.reload();
  }
}

// Add to window for easy access in console
if (import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).clearDevData = clearAllDevData;
}
