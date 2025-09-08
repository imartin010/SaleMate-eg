// IMMEDIATE ADMIN ROLE FIX
// Copy and paste this entire code into your browser console (F12) while on the SaleMate website
// This will immediately fix the admin role display issue

console.log('🚀 Starting immediate admin role fix...');

// Step 1: Clear ALL browser storage
console.log('🧹 Clearing all browser storage...');
localStorage.clear();
sessionStorage.clear();

// Step 2: Clear specific Supabase keys that might be cached
const supabaseKeys = [
  'sb-wkxbhvckmgrmdkdkhnqo-auth-token',
  'sb-wkxbhvckmgrmdkdkhnqo-refresh-token',
  'supabase.auth.token',
  'supabase.auth.refreshToken',
  'salemate-auth',
  'auth-storage',
  'supabase.auth.expires_at',
  'supabase.auth.expires_in',
  'supabase.auth.token_type',
  'supabase.auth.user',
  'supabase.auth.session'
];

supabaseKeys.forEach(key => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
  console.log(`✅ Removed: ${key}`);
});

// Step 3: Clear cookies
document.cookie.split(";").forEach(cookie => {
  const eqPos = cookie.indexOf("=");
  const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
  document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
});
console.log('🍪 Cleared all cookies');

// Step 4: Try to force refresh the auth store if available
try {
  if (window.useAuthStore) {
    console.log('🔄 Refreshing auth store...');
    const authStore = window.useAuthStore.getState();
    if (authStore.refreshProfile) {
      authStore.refreshProfile();
    }
  }
} catch (error) {
  console.log('⚠️ Could not access auth store:', error);
}

// Step 5: Force reload the page after a short delay
console.log('⏳ Reloading page in 2 seconds...');
setTimeout(() => {
  console.log('🔄 Reloading page now...');
  window.location.href = window.location.href + '?refresh=' + Date.now();
}, 2000);

console.log('✅ Admin role fix applied! Page will reload automatically.');
console.log('📝 After reload, your role should show as "Admin"');
