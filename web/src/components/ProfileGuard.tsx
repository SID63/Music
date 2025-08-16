import { useAuth } from '../context/AuthContext';
import ProfileSetup from './ProfileSetup';
import { Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import ProfileCompletionPrompt from './ProfileCompletionPrompt';

type ProfileGuardProps = {
  children: React.ReactNode;
  requireComplete?: boolean;
  feature?: string;
  allowedRoles?: string[];
};

export default function ProfileGuard({ children, requireComplete = true, feature = "this feature", allowedRoles }: ProfileGuardProps) {
  const { profile, loading } = useAuth();
  const location = useLocation();
  const [showPrompt, setShowPrompt] = useState(false);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no profile exists, show profile setup
  if (!profile) {
    return <ProfileSetup />;
  }

  // Check role-based access if allowedRoles is specified
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this feature.</p>
          <p className="text-gray-500 text-sm mt-2">Required role: {allowedRoles.join(' or ')}</p>
        </div>
      </div>
    );
  }

  // If profile is incomplete and we require complete profiles
  if (requireComplete && isProfileIncomplete(profile)) {
    // Avoid redirect loops if already on setup
    if (location.pathname !== '/setup') {
      return <Navigate to="/setup" replace state={{ from: location.pathname }} />;
    }
    return <>{children}</>;
  }

  // Profile is complete, show the protected content
  return <>{children}</>;
}

// Helper function to check if profile is complete
function isProfileIncomplete(profile: any): boolean {
  // Basic required fields
  if (!profile.display_name || !profile.location || !profile.bio) {
    return true;
  }

  // Musician-specific required fields
  if (profile.role === 'musician') {
    if (!profile.genres || profile.genres.length === 0) {
      return true;
    }
    if (!profile.price_min) {
      return true;
    }
  }

  return false;
}
