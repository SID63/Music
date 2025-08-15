import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function BandCreatePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect organizers away from band creation
  React.useEffect(() => {
    if (profile && profile.role === 'organizer') {
      navigate('/bands');
    }
  }, [profile, navigate]);

  if (profile?.role === 'organizer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h1>
          <p className="text-gray-600 mb-6">Event organizers cannot create bands.</p>
          <button
            onClick={() => navigate('/bands')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Bands
          </button>
        </div>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    setError(null);
    
    try {
      // Create band
      const { data: band, error: bandError } = await supabase
        .from('bands')
        .insert({ name, description, is_active: true })
        .select('id')
        .single();

      if (bandError || !band) {
        setError(bandError?.message || 'Failed to create band');
        setSubmitting(false);
        return;
      }

      // Add current user as leader
      const { error: memberError } = await supabase
        .from('band_members')
        .insert({ band_id: band.id, user_id: profile.user_id, role: 'leader' });

      if (memberError) {
        setError(memberError.message);
        setSubmitting(false);
        return;
      }

      navigate('/bands');
    } catch (err) {
      setError('Unexpected error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Create a New Band</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start your musical journey by creating a band. You'll automatically become the leader and can invite other musicians to join.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Band Information</h2>
            <p className="text-purple-100 text-sm">Fill in the details below to create your band</p>
          </div>
          
          <form onSubmit={onSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Band Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., The Midnight Jazzers, Electric Dreams, Acoustic Harmony"
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 text-lg"
                required
              />
              <p className="text-sm text-gray-500 mt-2">Choose a memorable name that represents your band's style</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Tell musicians and event organizers about your band's style, experience, and what makes you unique..."
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 resize-none"
              />
              <p className="text-sm text-gray-500 mt-2">Describe your musical style, influences, and what events you're best suited for</p>
            </div>

            {/* Features Preview */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                What happens next?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Band Created</h4>
                    <p className="text-sm text-gray-600">Your band profile is set up and ready</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-purple-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">You're the Leader</h4>
                    <p className="text-sm text-gray-600">Manage members and band settings</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Invite Musicians</h4>
                    <p className="text-sm text-gray-600">Send invites to join your band</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-orange-600 font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Start Booking</h4>
                    <p className="text-sm text-gray-600">Post events and get bookings as a band</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/bands')}
                className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium text-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Creating Band...
                  </div>
                ) : (
                  'Create Band'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
