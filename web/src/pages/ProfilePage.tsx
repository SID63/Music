import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { bandService } from '../services/bandService';
import type { Band } from '../types/band';

export default function ProfilePage() {
  const { profile, createProfile, user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [userBands, setUserBands] = useState<Band[]>([]);
  const [loadingBands, setLoadingBands] = useState(false);
  const [formData, setFormData] = useState({
    role: 'musician' as 'musician' | 'organizer',
  });

  const handleCreateProfile = async () => {
    setCreatingProfile(true);
    const { error } = await createProfile(formData.role, false);
    if (error) {
      alert('Failed to create profile: ' + error);
    }
    setCreatingProfile(false);
  };

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
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-semibold">Complete Your Profile</h2>
        
        {!showCreateForm ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800 mb-4">
              You need to complete your profile to use all features.
            </p>
            <div className="text-sm text-yellow-700 mb-4">
              <p><strong>Note:</strong> If you just verified your email, your profile should be created automatically.</p>
              <p>If you don't see your profile after a few seconds, use the button below.</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Profile Manually
            </button>
          </div>
        ) : (
          <div className="bg-white border rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">Select Your Role</h3>
                         <select
               value={formData.role}
               onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'musician' | 'organizer' }))}
               className="w-full border rounded-md px-3 py-2"
             >
               <option value="musician">Musician</option>
               <option value="organizer">Event Organizer</option>
             </select>
            
            <button
              onClick={handleCreateProfile}
              disabled={creatingProfile}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {creatingProfile ? 'Creating...' : 'Create Profile'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Show profile completion notice if incomplete
  if (isProfileIncomplete()) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-semibold">Complete Your Profile</h2>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-800 mb-4">
            Your profile is incomplete. Complete it to access all features!
          </p>
          <Link
            to="/setup"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Complete Profile Setup
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Your Profile</h2>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12 text-white">
          <div className="flex items-center space-x-6">
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
              <h1 className="text-4xl font-bold mb-2">
                {profile.display_name || 'Complete Your Profile'}
              </h1>
              <div className="flex items-center space-x-4 text-blue-100">
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium capitalize">
                  {profile.role}
                </span>
                {profile.role === 'musician' && profile.is_band !== null && (
                  <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                    {profile.is_band ? 'Band' : 'Individual Musician'}
                  </span>
                )}
                {profile.location && (
                  <span className="flex items-center space-x-1">
                    <span>📍</span>
                    <span>{profile.location}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-8 space-y-8">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Display Name</label>
                  <p className="text-gray-900 font-medium">{profile.display_name || 'Not set'}</p>
                </div>
                
                {profile.location && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-gray-900 font-medium">{profile.location}</p>
                  </div>
                )}
                
                {profile.bio && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Bio</label>
                    <p className="text-gray-900">{profile.bio}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Member Since</label>
                  <p className="text-gray-900 font-medium">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Profile Status</label>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-medium">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Musician-specific details */}
          {profile.role === 'musician' && (
            <div className="border-t pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Musician Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  {profile.genres && profile.genres.length > 0 && (
                    <div className="mb-6">
                      <label className="text-sm font-medium text-gray-500 mb-2 block">Genres</label>
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
                      <label className="text-sm font-medium text-gray-500 mb-2 block">Pricing Range</label>
                      <p className="text-gray-900 font-medium">
                        ${profile.price_min || '0'} - ${profile.price_max || 'No max'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  {profile.youtube_url && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">YouTube Sample</label>
                      <a 
                        href={profile.youtube_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <span>▶️</span>
                        <span>Watch Video</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bands Section */}
          {profile.role === 'musician' && (
            <div className="border-t pt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">My Bands</h3>
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
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">🎸</div>
                  <p className="text-gray-600 mb-4">You're not part of any bands yet</p>
                  <Link
                    to="/bands"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Explore Bands
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userBands.map((band) => (
                    <div
                      key={band.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{band.name}</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                                      {typeof band.member_count === 'number' ? band.member_count : 0} members
                        </span>
                      </div>
                      {band.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
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


        </div>
      </div>
    </div>
  );
}
