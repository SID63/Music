// Debug utilities for troubleshooting authentication and profile issues

export const debugAuthState = () => {
  const authToken = localStorage.getItem('sb-qmnspcgfhxnzhzoxxzkx-auth-token');
  const sessionToken = sessionStorage.getItem('sb-qmnspcgfhxnzhzoxxzkx-auth-token');
  const pendingData = localStorage.getItem('pendingProfileData');
  
  console.log('=== Auth Debug Info ===');
  console.log('Auth Token exists:', !!authToken);
  console.log('Session Token exists:', !!sessionToken);
  console.log('Pending Profile Data:', pendingData ? JSON.parse(pendingData) : null);
  
  if (authToken) {
    try {
      const tokenData = JSON.parse(authToken);
      console.log('Token expires at:', new Date(tokenData.expires_at * 1000));
      console.log('Token is expired:', Date.now() > tokenData.expires_at * 1000);
    } catch (error) {
      console.log('Error parsing auth token:', error);
    }
  }
  
  console.log('======================');
};

export const clearAllAuthData = () => {
  localStorage.removeItem('sb-qmnspcgfhxnzhzoxxzkx-auth-token');
  sessionStorage.removeItem('sb-qmnspcgfhxnzhzoxxzkx-auth-token');
  localStorage.removeItem('pendingProfileData');
  console.log('All auth data cleared');
};

export const logProfileCreationAttempt = (userId: string, role: string, isBand: boolean) => {
  console.log('=== Profile Creation Attempt ===');
  console.log('User ID:', userId);
  console.log('Role:', role);
  console.log('Is Band:', isBand);
  console.log('Timestamp:', new Date().toISOString());
  console.log('================================');
};
