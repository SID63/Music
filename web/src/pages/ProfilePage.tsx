import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { bandService } from '../services/bandService';
import type { Band } from '../types/band';

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const [userBands, setUserBands] = useState<Band[]>([]);
  const [loadingBands, setLoadingBands] = useState(false);
  
  // Extract video ID from YouTube URL
  const videoIdMatch = profile?.youtube_url?.match(/[?&]v=([^&#]+)/) || profile?.youtube_url?.match(/youtu\.be\/([^?&#]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : '';

  // Load user's bands
  useEffect(() => {
    if (user && profile?.role === 'musician') {
      loadUserBands();
    }
  }, [user, profile]);

  const loadUserBands = async () => {
    if (!user) return;
    
    setLoadingBands(true);
    const { data, error } = await bandService.getUserBands(user.id);
    if (!error && data) {
      setUserBands(data);
    }
    setLoadingBands(false);
  };

  // Check if profile is incomplete
  const isProfileIncomplete = () => {
    if (!profile) return true;
    
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
  };

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
        <h2 className="text-2xl font-semibold text-foreground">Create Your Profile</h2>
        <div className="bg-card ui-glass ui-vibrant-border border border-border rounded-lg p-6 text-center">
          <p className="text-muted-foreground mb-4">Let's set up your profile so you can book gigs or post events.</p>
          <Link
            to="/setup"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium w-full sm:w-auto min-h-12"
          >
            Go to Profile Setup
          </Link>
        </div>
      </div>
    );
  }

  // Show profile completion notice if incomplete
  if (isProfileIncomplete()) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
        <h2 className="text-2xl font-semibold text-foreground">Complete Your Profile</h2>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-800 mb-4">
            Your profile is incomplete. Complete it to access all features!
          </p>
          <Link
            to="/setup"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium w-full sm:w-auto min-h-12"
          >
            Complete Profile Setup
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0 space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Your Profile</h2>
      </div>
      
      <div className="bg-card ui-glass ui-vibrant-border rounded-xl shadow-sm border border-border overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 sm:px-8 py-8 sm:py-12 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="relative">
              <img
                src={profile.avatar_url || `data:image/svg+xml;base64,${btoa(`
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="120" height="120" fill="#6B7280"/>
                    <text x="60" y="70" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">No Image</text>
                  </svg>
                `)}`}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                onError={(e) => {
                  e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="120" height="120" fill="#6B7280"/>
                      <text x="60" y="70" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">No Image</text>
                    </svg>
                  `)}`;
                }}
              />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-4xl font-bold mb-2">
                {profile.display_name || 'Complete Your Profile'}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-blue-100">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium capitalize">
                  {profile.role}
                </span>
                {profile.role === 'musician' && profile.is_band !== null && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    {profile.is_band ? 'Band' : 'Individual Musician'}
                  </span>
                )}
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <span>📍</span>
                    <span>{profile.location}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Display Name</label>
                  <p className="text-foreground font-medium">{profile.display_name || 'Not set'}</p>
                </div>
                
                {profile.location && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <p className="text-foreground font-medium">{profile.location}</p>
                  </div>
                )}
                
                {profile.bio && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bio</label>
                    <p className="text-foreground">{profile.bio}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Account Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                  <p className="text-foreground font-medium">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Profile Status</label>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Video Section */}
          {videoId && (
            <div className="border-t pt-6 sm:pt-8">
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                Your Video Sample
              </h3>
              <div className="aspect-video rounded-xl overflow-hidden shadow-lg max-w-2xl">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="Your YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <a 
                  href={profile.youtube_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm w-full sm:w-auto"
                >
                  <span>▶️</span>
                  <span>View on YouTube</span>
                </a>
                <Link
                  to="/profile/edit"
                  className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm w-full sm:w-auto"
                >
                  <span>✏️</span>
                  <span>Edit Video URL</span>
                </Link>
              </div>
            </div>
          )}

          {/* Musician-specific details */}
          {profile.role === 'musician' && (
            <div className="border-t pt-6 sm:pt-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">Musician Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div>
                  {profile.genres && profile.genres.length > 0 && (
                    <div className="mb-6">
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Genres</label>
                      <div className="flex flex-wrap gap-2">
                        {profile.genres.map((genre, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(profile.price_min || profile.price_max) && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Pricing Range</label>
                      <p className="text-foreground font-medium">
                        ₹{profile.price_min || '0'} - ₹{profile.price_max || 'No max'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  {!profile.youtube_url && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Video Sample</label>
                      <p className="text-muted-foreground text-sm mb-3">No video sample added yet</p>
                      <Link
                        to="/profile/edit"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <span>➕</span>
                        <span>Add Video Sample</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bands Section */}
          {profile.role === 'musician' && (
            <div className="border-t pt-6 sm:pt-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h3 className="text-lg font-semibold text-foreground">My Bands</h3>
                <Link
                  to="/bands"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Explore Bands →
                </Link>
              </div>
              
              {loadingBands ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : userBands.length === 0 ? (
                <div className="text-center py-8 p-6 sm:p-8">
                  <div className="text-muted-foreground text-4xl mb-4">🎸</div>
                  <p className="text-muted-foreground mb-4">You're not part of any bands yet</p>
                  <Link
                    to="/bands"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium w-full sm:w-auto min-h-11 text-center"
                  >
                    Explore Bands
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {userBands.map((band) => (
                    <div
                      key={band.id}
                      className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow bg-card/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-foreground">{band.name}</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                                          {typeof band.member_count === 'number' ? band.member_count : 0} members
                        </span>
                      </div>
                      {band.description && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {band.description}
                        </p>
                      )}
                      <Link
                        to={`/bands/${band.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Band →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Edit Profile Button */}
          <div className="border-t pt-6 sm:pt-8 text-center">
            <Link
              to="/profile/edit"
              className="inline-flex items-center justify-center space-x-2 px-8 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-foreground rounded-xl hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 glass dark:glass-dark w-full sm:w-auto"
            >
              <span>✏️</span>
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
