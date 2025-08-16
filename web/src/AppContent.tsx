import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MusicianDirectory from './pages/MusicianDirectory';
import MusicianProfile from './pages/MusicianProfile';
import EventsBoard from './pages/EventsBoard';
import EventDetailPage from './pages/EventDetailPage';
import EventPostForm from './pages/EventPostForm';
import EventEditPage from './pages/EventEditPage';
import EventApplicationsPage from './pages/EventApplicationsPage';
import EventApplyPage from './pages/EventApplyPage';
import ProfileEdit from './pages/ProfileEdit';
import ProfilePage from './pages/ProfilePage';
import BandsPage from './pages/BandsPage';
import BandDetailPage from './pages/BandDetailPage';
import BandCreatePage from './pages/BandCreatePage';
import MessagesPage from './pages/MessagesPage';
import ReviewsPage from './pages/ReviewsPage';
import ReviewForm from './components/ReviewForm';
import AppearancePage from './pages/AppearancePage';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireProfile?: boolean;
};

function ProtectedRoute({ children, requireProfile = true }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  
  // Debug logging
  console.log('ProtectedRoute - Debug:', { 
    path: location.pathname, 
    loading, 
    user: !!user, 
    profile: !!profile,
    profileComplete: profile?.display_name ? 'yes' : 'no',
    requireProfile,
    timestamp: new Date().toISOString()
  });
  
  if (loading) {
    console.log('ProtectedRoute - Loading auth state...');
    return <LoadingScreen message="Checking authentication..." showRetry={false} />;
  }
  
  // If not authenticated, redirect to login with return URL
  if (!user) {
    console.log('ProtectedRoute - No user, redirecting to login');
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  
  // If profile is required but not loaded or incomplete
  // Skip this check for the profile edit page to prevent redirect loops
  if (requireProfile && !location.pathname.startsWith('/profile/edit') && (!profile || !profile.display_name)) {
    console.log('ProtectedRoute - Profile incomplete, redirecting to profile edit', { 
      hasProfile: !!profile, 
      hasDisplayName: profile?.display_name,
      currentPath: location.pathname
    });
    return <Navigate to="/profile/edit" state={{ from: location }} replace />;
  }
  
  console.log('ProtectedRoute - Access granted to:', location.pathname);
  return <>{children}</>;
}

type ReviewFormWrapperProps = {
  profileId?: string;
};

const ReviewFormWrapper = ({ profileId }: ReviewFormWrapperProps) => {
  const { profileId: urlProfileId } = useParams<{ profileId: string }>();
  const resolvedProfileId = profileId || urlProfileId;
  
  if (!resolvedProfileId) {
    return <div>Error: No profile ID provided</div>;
  }
  
  return <ReviewForm revieweeProfileId={resolvedProfileId} />;
};

export default function AppContent() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      
      {/* Public but layout-wrapped routes */}
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/events" replace />} />
        <Route path="/musicians" element={<MusicianDirectory />} />
        <Route path="/musicians/:id" element={<MusicianProfile />} />
        <Route path="/events" element={<EventsBoard />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/appearance" element={<AppearancePage />} />
        <Route path="/setup" element={<Navigate to="/profile/edit" replace />} />
        
        {/* Band routes */}
        <Route path="/bands" element={
          <ProtectedRoute>
            <BandsPage />
          </ProtectedRoute>
        } />
        <Route path="/bands/create" element={
          <ProtectedRoute>
            <BandCreatePage />
          </ProtectedRoute>
        } />
        <Route path="/bands/:bandId" element={
          <ProtectedRoute>
            <BandDetailPage />
          </ProtectedRoute>
        } />
      </Route>
      
      {/* Protected routes */}
      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="/events/new" element={<EventPostForm />} />
        <Route path="/events/:id/edit" element={<EventEditPage />} />
        <Route path="/events/:id/apply" element={<EventApplyPage />} />
        <Route path="/events/:id/applications" element={<EventApplicationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/bands" element={<BandsPage />} />
        <Route path="/bands/new" element={<BandCreatePage />} />
        <Route path="/bands/:id" element={<BandDetailPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:conversationId" element={<MessagesPage />} />
        <Route path="/reviews/:musicianId" element={<ReviewsPage />} />
        <Route path="/reviews/new/:profileId" element={<ReviewFormWrapper />} />
      </Route>

      {/* 404 - Not Found */}
      <Route path="*" element={
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl mb-8">Page not found</p>
          <a href="/" className="text-blue-600 hover:underline">
            Return to home
          </a>
        </div>
      } />
    </Routes>
  );
}
