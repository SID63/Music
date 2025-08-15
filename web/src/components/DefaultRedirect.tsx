import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function DefaultRedirect() {
  const { user, profile, loading, getDefaultRedirectPath, isProfileComplete } = useAuth();

  useEffect(() => {
    // Only redirect if not loading and user is authenticated
    if (!loading && user && profile) {
      const redirectPath = getDefaultRedirectPath();
      
      console.log('DefaultRedirect: User authenticated, checking redirect...', {
        currentPath: window.location.pathname,
        redirectPath,
        userRole: profile.role,
        profileComplete: isProfileComplete(profile),
        genres: profile.genres ? profile.genres.length : 0
      });
      
      // Only redirect if we're on the home page and the redirect path is different
      if (window.location.pathname === '/' && redirectPath !== '/') {
        console.log('DefaultRedirect: Redirecting to', redirectPath);
        // Use a small delay to ensure the profile is fully loaded
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 100);
      }
    }
  }, [user, profile, loading]); // Removed getDefaultRedirectPath from dependencies

  // This component doesn't render anything
  return null;
}
