// Emergency Fix Script for Infinite Loading
// Run this in your browser console (F12 -> Console tab) to immediately fix the loading issue

console.log('🔧 Running emergency fix for infinite loading...');

// Clear all Supabase tokens
const clearSupabaseTokens = () => {
  // Clear from localStorage
  const localStorageKeys = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('sb-')
  );
  localStorageKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log('🗑️ Removed from localStorage:', key);
  });
  
  // Clear from sessionStorage
  const sessionStorageKeys = Object.keys(sessionStorage).filter(key => 
    key.includes('supabase') || key.includes('sb-')
  );
  sessionStorageKeys.forEach(key => {
    sessionStorage.removeItem(key);
    console.log('🗑️ Removed from sessionStorage:', key);
  });
  
  console.log('✅ Cleared all Supabase tokens');
};

// Clear tokens
clearSupabaseTokens();

// Force reload the page
console.log('🔄 Reloading page...');
setTimeout(() => {
  window.location.reload();
}, 1000);

// Instructions for after reload
console.log(`
📋 After the page reloads:
1. You should see the login page
2. Sign in with your credentials
3. If you still have issues, try signing up again

💡 If you continue to have problems:
- Check your internet connection
- Try a different browser
- Clear all browser data (Ctrl+Shift+Delete)
`);
