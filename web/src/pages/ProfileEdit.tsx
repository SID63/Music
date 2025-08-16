import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Navigate, useNavigate } from 'react-router-dom';

export default function ProfileEdit() {
  const { profile, refreshProfile, clearInvalidTokens } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    display_name: '',
    location: '',
    bio: '',
    genres: [] as string[],
    price_min: '',
    price_max: '',
    youtube_url: '',
    is_band: false,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        location: profile.location || '',
        bio: profile.bio || '',
        genres: profile.genres || [],
        price_min: profile.price_min?.toString() || '',
        price_max: profile.price_max?.toString() || '',
        youtube_url: profile.youtube_url || '',
        is_band: profile.is_band || false,
      });
    }
  }, [profile]);

  // Get current location from device
  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Reverse geocode to get address
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then(response => response.json())
            .then(data => {
              const address = data.display_name.split(',').slice(0, 3).join(',');
              setFormData(prev => ({ ...prev, location: address }));
              setLocationLoading(false);
            })
            .catch(() => {
              setFormData(prev => ({ ...prev, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
              setLocationLoading(false);
            });
        },
        (error) => {
          console.error('Location error:', error);
          setLocationLoading(false);
          alert('Could not get your location. Please enter manually.');
        }
      );
    } else {
      setLocationLoading(false);
      alert('Geolocation is not supported by this browser.');
    }
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    // Additional validation: check if file is actually an image
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (!e.target?.result || typeof e.target.result === 'string') {
        alert('Invalid file type');
        return;
      }
      
      const arr = new Uint8Array(e.target.result).subarray(0, 4);
      let header = '';
      for (let i = 0; i < arr.length; i++) {
        header += arr[i].toString(16);
      }
      
      // Check for common image file signatures
      const isImage = /^(ffd8ff|89504e47|47494638|67696638a)$/.test(header);
      if (!isImage) {
        alert('Please select a valid image file');
        return;
      }

      // Proceed with upload
      setUploading(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // Update profile with new avatar URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', profile.id);

        if (updateError) {
          throw updateError;
        }

        // Refresh profile data
        await refreshProfile();
        alert('Profile picture updated successfully!');
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        alert('Failed to upload profile picture. Please try again.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          location: formData.location,
          bio: formData.bio,
          genres: formData.genres,
          price_min: formData.price_min ? Number(formData.price_min) : null,
          price_max: formData.price_max ? Number(formData.price_max) : null,
          youtube_url: formData.youtube_url,
          is_band: formData.is_band,
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addGenre = (genre: string) => {
    if (genre.trim() && !formData.genres.includes(genre.trim())) {
      setFormData(prev => ({
        ...prev,
        genres: [...prev.genres, genre.trim()]
      }));
    }
  };

  const removeGenre = (index: number) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.filter((_, i) => i !== index)
    }));
  };

  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center p-6 max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Not Signed In</h2>
          <p className="text-gray-600 mb-6">Please sign in to edit your profile.</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/setup" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Edit Your Profile</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Update your profile information to help event organizers and other musicians find you
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Profile Information</h2>
            <p className="text-blue-100">Keep your profile up to date with the latest information</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Profile Picture Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Profile Picture</h3>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="relative">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center border-4 border-gray-200">
                      <span className="text-2xl text-white">🎵</span>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl hover:from-pink-600 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {uploading ? 'Uploading...' : 'Change Picture'}
                  </button>
                  <p className="text-sm text-gray-500 mt-2">JPG, PNG, or GIF up to 5MB</p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Basic Information</h3>
              </div>
              
              <div>
                <label htmlFor="display_name" className="block text-lg font-semibold text-gray-700 mb-3">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="display_name"
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Enter your display name"
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-lg"
                  required
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-lg font-semibold text-gray-700 mb-3">
                  Location
                </label>
                <div className="flex gap-3">
                  <input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter your city or location"
                    className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 whitespace-nowrap"
                  >
                    {locationLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Locating...
                      </div>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Use GPS
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="block text-lg font-semibold text-gray-700 mb-3">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={5}
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself, your musical background, and what makes you unique..."
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="is_band"
                  type="checkbox"
                  checked={formData.is_band}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_band: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-4 focus:ring-blue-100 focus:ring-blue-500"
                />
                <label htmlFor="is_band" className="text-lg font-semibold text-gray-700">
                  I am a band (not an individual musician)
                </label>
              </div>
            </div>

            {/* Musical Preferences */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Musical Preferences</h3>
              </div>
              
              <div>
                <label htmlFor="genres" className="block text-lg font-semibold text-gray-700 mb-3">
                  Musical Genres
                </label>
                <div className="flex gap-3 mb-4">
                  <input
                    id="genres"
                    type="text"
                    placeholder="e.g., Jazz, Rock, Classical"
                    className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const target = e.target as HTMLInputElement;
                        addGenre(target.value);
                        target.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('genres') as HTMLInputElement;
                      addGenre(input.value);
                      input.value = '';
                    }}
                    className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Add Genre
                  </button>
                </div>
                
                {formData.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.genres.map((genre, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold"
                      >
                        {genre}
                        <button
                          type="button"
                          onClick={() => removeGenre(index)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="price_min" className="block text-lg font-semibold text-gray-700 mb-3">
                    Minimum Price (₹)
                  </label>
                  <input
                    id="price_min"
                    type="number"
                    min="0"
                    value={formData.price_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_min: e.target.value }))}
                    placeholder="e.g., 100"
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="price_max" className="block text-lg font-semibold text-gray-700 mb-3">
                    Maximum Price (₹)
                  </label>
                  <input
                    id="price_max"
                    type="number"
                    min="0"
                    value={formData.price_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_max: e.target.value }))}
                    placeholder="e.g., 1000"
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="youtube_url" className="block text-lg font-semibold text-gray-700 mb-3">
                  YouTube URL
                </label>
                <input
                  id="youtube_url"
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtube_url: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all duration-200"
                />
                <p className="text-sm text-gray-500 mt-2">Share a sample of your music or performance</p>
                
                {/* Video Preview */}
                {formData.youtube_url && (
                  <div className="mt-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                        Video Preview
                      </h4>
                      
                      {(() => {
                        const videoIdMatch = formData.youtube_url.match(/[?&]v=([^&#]+)/) || formData.youtube_url.match(/youtu\.be\/([^?&#]+)/);
                        const videoId = videoIdMatch ? videoIdMatch[1] : '';
                        
                        if (videoId) {
                          return (
                            <div className="space-y-3">
                              <div className="aspect-video rounded-lg overflow-hidden shadow-md">
                                <iframe
                                  className="w-full h-full"
                                  src={`https://www.youtube.com/embed/${videoId}`}
                                  title="Video preview"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                />
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-green-600 font-medium">✓ Valid YouTube URL</span>
                                <a 
                                  href={formData.youtube_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-red-600 hover:text-red-700 font-medium"
                                >
                                  Open on YouTube →
                                </a>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-center py-6 text-gray-500">
                              <div className="text-2xl mb-2">⚠️</div>
                              <p className="text-sm">Please enter a valid YouTube URL</p>
                              <p className="text-xs mt-1">Format: https://www.youtube.com/watch?v=VIDEO_ID</p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t-2 border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold text-lg"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                    Updating Profile...
                  </div>
                ) : (
                  'Update Profile'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
