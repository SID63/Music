import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function ProfileSetup() {
  const { profile, refreshProfile, createProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'musician' | 'organizer'>('musician');
  const [isBand, setIsBand] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    location: profile?.location || '',
    bio: profile?.bio || '',
    genres: profile?.genres || [],
    price_min: profile?.price_min?.toString() || '',
    price_max: profile?.price_max?.toString() || '',
    youtube_url: profile?.youtube_url || '',
    is_band: profile?.is_band || false,
  });

  const [attempted, setAttempted] = useState(false);

  // Update form data when profile changes
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAttempted(true);

    // Validation (inline, block submit without alerts)
    const isMusician = profile?.role === 'musician';
    const validBasics = !!formData.display_name?.trim() && !!formData.location?.trim() && !!formData.bio?.trim();
    const validMusician = !isMusician || (formData.genres.length > 0 && !!formData.price_min);
    const isValid = validBasics && validMusician;
    if (!isValid) return;
    
    setLoading(true);
    
    try {
      // If no profile exists, create one first
      if (!profile) {
        const { error: createError } = await createProfile(role, isBand);
        if (createError) {
          throw new Error(createError);
        }
        // Refresh to get the new profile
        await refreshProfile();
        return; // The component will re-render with the new profile
      }

      // Update existing profile
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name.trim(),
          location: formData.location.trim(),
          bio: formData.bio.trim(),
          genres: formData.genres.length > 0 ? formData.genres.filter(g => g.trim()) : null,
          price_min: formData.price_min ? parseInt(formData.price_min) : null,
          price_max: formData.price_max ? parseInt(formData.price_max) : null,
          youtube_url: formData.youtube_url?.trim() || null,
          is_band: profile.role === 'musician' ? formData.is_band : null,
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      navigate('/');
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addGenre = () => {
    setFormData(prev => ({ ...prev, genres: [...prev.genres, ''] }));
  };

  const updateGenre = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.map((g, i) => i === index ? value : g)
    }));
  };

  const removeGenre = (index: number) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.filter((_, i) => i !== index)
    }));
  };

  // Render role selection for new users
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative z-10" key="profile-setup-new-user">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-3xl">🎵</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Music Connect!</h1>
            <p className="text-gray-600">Let's get started by creating your profile</p>
          </div>

          {/* Role Selection */}
          <div className="bg-white rounded-xl shadow-lg border p-8 relative z-20">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Role</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="relative">
                    <input
                      type="radio"
                      name="role"
                      value="musician"
                      checked={role === 'musician'}
                      onChange={(e) => setRole(e.target.value as 'musician' | 'organizer')}
                      className="sr-only"
                    />
                    <div className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      role === 'musician' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="text-center">
                        <div className="text-3xl mb-2">🎸</div>
                        <h3 className="font-semibold text-gray-900">Musician</h3>
                        <p className="text-sm text-gray-600 mt-1">I want to get booked for events</p>
                      </div>
                    </div>
                  </label>

                  <label className="relative">
                    <input
                      type="radio"
                      name="role"
                      value="organizer"
                      checked={role === 'organizer'}
                      onChange={(e) => setRole(e.target.value as 'musician' | 'organizer')}
                      className="sr-only"
                    />
                    <div className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      role === 'organizer' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="text-center">
                        <div className="text-3xl mb-2">🎪</div>
                        <h3 className="font-semibold text-gray-900">Event Organizer</h3>
                        <p className="text-sm text-gray-600 mt-1">I want to book musicians for events</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {role === 'musician' && (
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isBand}
                      onChange={(e) => setIsBand(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">I'm a band (not a solo artist)</span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Profile...' : 'Create Profile'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Render profile completion form for existing users
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative z-10" key={`profile-setup-existing-${profile.id}`}>
      <div className="w-full max-w-4xl">
        {/* Setup Form */}
        <div className="bg-white rounded-xl shadow-lg border p-8 relative z-20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {profile.role === 'musician' ? 'Artist/Band Name' : 'Organization Name'} *
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={profile.role === 'musician' ? 'Your name or band name' : 'Your organization name'}
                  required
                />
                {attempted && !formData.display_name?.trim() && (
                  <p className="text-sm text-red-600 mt-1">Display name is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="City, State or Country"
                  required
                />
                {attempted && !formData.location?.trim() && (
                  <p className="text-sm text-red-600 mt-1">Location is required</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio *</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all h-24 resize-none"
                placeholder={profile.role === 'musician' 
                  ? 'Tell us about your music, experience, and what makes you unique...'
                  : 'Tell us about your organization and the types of events you host...'
                }
                required
              />
              {attempted && !formData.bio?.trim() && (
                <p className="text-sm text-red-600 mt-1">Bio is required</p>
              )}
            </div>

            {/* Musician-specific fields */}
            {profile.role === 'musician' && (
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.is_band}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_band: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">This is a band</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Genres *</label>
                  <div className="space-y-2">
                    {formData.genres.map((genre, index) => (
                      <div key={index} className="flex space-x-2">
                        <input
                          type="text"
                          value={genre}
                          onChange={(e) => updateGenre(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="e.g., Rock, Jazz, Electronic"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeGenre(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addGenre}
                      className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors text-sm"
                    >
                      + Add Genre
                    </button>
                  </div>
                  {attempted && formData.genres.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">Please add at least one genre</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Price ($) *</label>
                    <input
                      type="number"
                      value={formData.price_min}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_min: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="0"
                      min="0"
                      required
                    />
                    {attempted && !formData.price_min && (
                      <p className="text-sm text-red-600 mt-1">Minimum price is required</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Price ($)</label>
                    <input
                      type="number"
                      value={formData.price_max}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_max: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="1000"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">YouTube Sample Video</label>
                  <input
                    type="url"
                    value={formData.youtube_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, youtube_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Add a YouTube URL to showcase your music (optional but recommended)
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !((!!formData.display_name?.trim()) && (!!formData.location?.trim()) && (!!formData.bio?.trim()) && (profile.role !== 'musician' || (formData.genres.length > 0 && !!formData.price_min)))}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
              >
                {loading ? 'Setting Up Profile...' : 'Complete Profile & Get Started'}
              </button>
              <p className="text-sm text-gray-500 text-center mt-3">
                You can always edit your profile later from your profile page
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
