// Quick fix to force profile refresh in browser console
// Copy and paste this in the browser console (F12) while on the website

console.log('🔄 Force refreshing user profile...');

// Method 1: Clear localStorage and sessionStorage
localStorage.clear();
sessionStorage.clear();
console.log('✅ Cleared browser storage');

// Method 2: Force refresh the page
setTimeout(() => {
    console.log('🔄 Reloading page...');
    window.location.reload(true);
}, 1000);

// Alternative method if the above doesn't work:
// You can also try this in the console:
// window.useAuthStore.getState().refreshProfile();
