// Clear all authentication data from browser storage
export const clearAllAuthData = () => {
  console.log('🧹 Clearing all authentication data...');
  
  // Clear localStorage
  localStorage.clear();
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Clear specific Supabase keys
  const keysToRemove = [
    'sb-wkxbhvckmgrmdkdkhnqo-auth-token',
    'sb-wkxbhvckmgrmdkdkhnqo-refresh-token',
    'supabase.auth.token',
    'supabase.auth.refreshToken',
    'salemate-auth',
    'supabase.auth.expires_at',
    'supabase.auth.expires_in',
    'supabase.auth.token_type',
    'supabase.auth.user',
    'supabase.auth.session'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  // Clear cookies
  document.cookie.split(";").forEach(cookie => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  });
  
  console.log('✅ All authentication data cleared');
  
  // Force page reload
  window.location.reload();
};

// Clear only Supabase auth data
export const clearSupabaseAuth = () => {
  console.log('🧹 Clearing Supabase authentication data...');
  
  const supabaseKeys = [
    'sb-wkxbhvckmgrmdkdkhnqo-auth-token',
    'sb-wkxbhvckmgrmdkdkhnqo-refresh-token',
    'supabase.auth.token',
    'supabase.auth.refreshToken',
    'supabase.auth.expires_at',
    'supabase.auth.expires_in',
    'supabase.auth.token_type',
    'supabase.auth.user',
    'supabase.auth.session'
  ];
  
  supabaseKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  console.log('✅ Supabase authentication data cleared');
};
