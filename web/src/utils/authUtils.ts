// Authentication utility functions

/**
 * Clears all Supabase authentication tokens from browser storage
 * This is useful when dealing with invalid refresh token errors
 */
export const clearSupabaseTokens = () => {
  // Clear from localStorage
  const localStorageKeys = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('sb-')
  );
  localStorageKeys.forEach(key => localStorage.removeItem(key));
  
  // Clear from sessionStorage
  const sessionStorageKeys = Object.keys(sessionStorage).filter(key => 
    key.includes('supabase') || key.includes('sb-')
  );
  sessionStorageKeys.forEach(key => sessionStorage.removeItem(key));
  
  console.log('Cleared Supabase tokens from browser storage');
};

/**
 * Checks if the current user has a valid session
 * Returns true if valid, false if invalid or expired
 */
export const checkAuthStatus = async () => {
  try {
    const { data: { session }, error } = await import('../lib/supabaseClient').then(({ supabase }) => 
      supabase.auth.getSession()
    );
    
    if (error) {
      console.error('Auth status check error:', error);
      return false;
    }
    
    return !!session;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
};

/**
 * Forces a token refresh
 * Useful when dealing with token expiration issues
 */
export const refreshAuthToken = async () => {
  try {
    const { data, error } = await import('../lib/supabaseClient').then(({ supabase }) => 
      supabase.auth.refreshSession()
    );
    
    if (error) {
      console.error('Token refresh error:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return { success: false, error };
  }
};
