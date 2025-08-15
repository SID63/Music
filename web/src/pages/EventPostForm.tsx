import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import BandActionSelector from '../components/BandActionSelector';

export default function EventPostForm() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showActionSelector, setShowActionSelector] = useState(true); // Start with action selector
  const [selectedActionType, setSelectedActionType] = useState<'individual' | 'band'>('individual');
  const [selectedBandId, setSelectedBandId] = useState<string | undefined>(undefined);

  const handleActionSelect = (actionType: 'individual' | 'band', bandId?: string) => {
    console.log('Action selected:', actionType, 'Band ID:', bandId);
    setSelectedActionType(actionType);
    setSelectedBandId(bandId);
    setShowActionSelector(false);
    console.log('Action selector hidden, should show form now');
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submitted!');
    console.log('Profile:', profile);
    
    if (!profile || (profile.role !== 'organizer' && profile.role !== 'musician')) {
      console.log('Profile validation failed');
      return;
    }
    
    // Don't proceed if action selector is currently shown
    if (showActionSelector) {
      console.log('Action selector is shown, ignoring form submission');
      return;
    }
    
    console.log('Action type selected:', selectedActionType, 'Band ID:', selectedBandId);
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const form = new FormData(e.currentTarget);
      
      // Get form values
      const title = String(form.get('title') || '').trim();
      const startsAt = String(form.get('starts_at') || '');
      const endsAt = String(form.get('ends_at') || '');
      const budgetMin = form.get('budget_min') ? Number(form.get('budget_min')) : null;
      const budgetMax = form.get('budget_max') ? Number(form.get('budget_max')) : null;
      
      // Validation
      if (!title) {
        setError('Event title is required');
        return;
      }
      
      if (!startsAt) {
        setError('Start date and time is required');
        return;
      }
      
      // Check if start date is in the future
      const startDate = new Date(startsAt);
      if (startDate <= new Date()) {
        setError('Start date must be in the future');
        return;
      }
      
      // Check if end date is after start date
      if (endsAt) {
        const endDate = new Date(endsAt);
        if (endDate <= startDate) {
          setError('End date must be after start date');
          return;
        }
      }
      
      // Check budget range
      if (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) {
        setError('Minimum budget cannot be greater than maximum budget');
        return;
      }
      
      // Parse genres as array
      const genresInput = String(form.get('genres') || '');
      const genres = genresInput ? genresInput.split(',').map(g => g.trim()).filter(g => g) : [];
      
      // Parse event type
      const eventType = String(form.get('event_type') || 'gig');
      
      // Prepare event data based on action type
      const eventData: any = {
        organizer_profile_id: profile.id,
        title: title,
        description: String(form.get('description') || ''),
        location: String(form.get('location') || ''),
        event_type: eventType,
        genres: genres,
        starts_at: startDate.toISOString(),
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        budget_min: budgetMin,
        budget_max: budgetMax,
        contact_email: String(form.get('contact_email') || ''),
        contact_phone: String(form.get('contact_phone') || ''),
        requirements: String(form.get('requirements') || ''),
        equipment_provided: String(form.get('equipment_provided') || ''),
        parking_info: String(form.get('parking_info') || ''),
        additional_notes: String(form.get('additional_notes') || ''),
        posted_by_type: selectedActionType,
      };

      // Add band-specific data if posting as a band
      if (selectedActionType === 'band' && selectedBandId) {
        eventData.band_id = selectedBandId;
      }
      
      console.log('Attempting to insert event with data:', eventData);
      
      // Check authentication status
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      
      const { data, error: insertError } = await supabase.from('events').insert(eventData);
      
      console.log('Insert result:', { data, error: insertError });
      
      if (insertError) {
        console.error('Insert error:', insertError);
        setError(insertError.message);
      } else {
        console.log('Event created successfully:', data);
        // Success - redirect to events board
        navigate('/events');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile || (profile.role !== 'organizer' && profile.role !== 'musician')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Only organizers and musicians can post events.</p>
        </div>
      </div>
    );
  }

  // Show action selector if needed
  if (showActionSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BandActionSelector
            onSelect={handleActionSelect}
            title="Post Event As"
            description="Choose whether to post this event as an individual or as a band leader"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Post a New Event</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create a detailed event listing to attract the right musicians and bands
          </p>
          {selectedActionType === 'band' && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-xl">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-purple-800 font-semibold">Posting as Band</span>
            </div>
          )}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Event Details</h2>
            <p className="text-blue-100">Fill in the information below to create your event listing</p>
          </div>
          
          <form onSubmit={onSubmit} className="p-8 space-y-8">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
                <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Basic Event Information */}
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
                <label htmlFor="title" className="block text-lg font-semibold text-gray-700 mb-3">
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g., Summer Music Festival, Wedding Reception, Corporate Event"
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-lg"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-lg font-semibold text-gray-700 mb-3">
                  Event Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  placeholder="Describe your event, the atmosphere you're looking for, and what makes it special..."
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="event_type" className="block text-lg font-semibold text-gray-700 mb-3">
                    Event Type
                  </label>
                  <select
                    id="event_type"
                    name="event_type"
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="gig">🎵 Gig/Performance</option>
                    <option value="wedding">💒 Wedding</option>
                    <option value="corporate">🏢 Corporate Event</option>
                    <option value="festival">🎪 Festival</option>
                    <option value="party">🎉 Private Party</option>
                    <option value="ceremony">⛪ Ceremony</option>
                    <option value="other">✨ Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="genres" className="block text-lg font-semibold text-gray-700 mb-3">
                    Preferred Genres
                  </label>
                  <input
                    id="genres"
                    name="genres"
                    type="text"
                    placeholder="e.g., Jazz, Rock, Classical, Pop (comma-separated)"
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Location and Timing */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Location & Timing</h3>
              </div>
              
              <div>
                <label htmlFor="location" className="block text-lg font-semibold text-gray-700 mb-3">
                  Event Location
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="e.g., Central Park, Grand Hotel, 123 Main Street"
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="starts_at" className="block text-lg font-semibold text-gray-700 mb-3">
                    Start Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="starts_at"
                    name="starts_at"
                    type="datetime-local"
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="ends_at" className="block text-lg font-semibold text-gray-700 mb-3">
                    End Date & Time
                  </label>
                  <input
                    id="ends_at"
                    name="ends_at"
                    type="datetime-local"
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                    onChange={(e) => {
                      const endDate = new Date(e.target.value);
                      const startInput = document.getElementById('starts_at') as HTMLInputElement;
                      if (startInput && startInput.value && endDate <= new Date(startInput.value)) {
                        e.target.setCustomValidity('End date must be after start date');
                      } else {
                        e.target.setCustomValidity('');
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Budget Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Budget & Compensation</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="budget_min" className="block text-lg font-semibold text-gray-700 mb-3">
                    Minimum Budget ($)
                  </label>
                  <input
                    id="budget_min"
                    name="budget_min"
                    type="number"
                    min="0"
                    placeholder="e.g., 200"
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-yellow-100 focus:border-yellow-500 transition-all duration-200"
                    onChange={(e) => {
                      const min = Number(e.target.value);
                      const maxInput = document.getElementById('budget_max') as HTMLInputElement;
                      if (maxInput && maxInput.value && min > Number(maxInput.value)) {
                        e.target.setCustomValidity('Min budget cannot exceed max budget');
                      } else {
                        e.target.setCustomValidity('');
                      }
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="budget_max" className="block text-lg font-semibold text-gray-700 mb-3">
                    Maximum Budget ($)
                  </label>
                  <input
                    id="budget_max"
                    name="budget_max"
                    type="number"
                    min="0"
                    placeholder="e.g., 1000"
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-yellow-100 focus:border-yellow-500 transition-all duration-200"
                    onChange={(e) => {
                      const max = Number(e.target.value);
                      const minInput = document.getElementById('budget_min') as HTMLInputElement;
                      if (minInput && minInput.value && Number(minInput.value) > max) {
                        e.target.setCustomValidity('Max budget cannot be less than min budget');
                      } else {
                        e.target.setCustomValidity('');
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Contact Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contact_email" className="block text-lg font-semibold text-gray-700 mb-3">
                    Contact Email
                  </label>
                  <input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    placeholder="your@email.com"
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="contact_phone" className="block text-lg font-semibold text-gray-700 mb-3">
                    Contact Phone
                  </label>
                  <input
                    id="contact_phone"
                    name="contact_phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Additional Details</h3>
              </div>
              
              <div>
                <label htmlFor="requirements" className="block text-lg font-semibold text-gray-700 mb-3">
                  Musician Requirements
                </label>
                <textarea
                  id="requirements"
                  name="requirements"
                  rows={4}
                  placeholder="e.g., Must bring own instruments, Dress code: formal, Experience level required..."
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 resize-none"
                />
              </div>

              <div>
                <label htmlFor="equipment_provided" className="block text-lg font-semibold text-gray-700 mb-3">
                  Equipment Provided
                </label>
                <textarea
                  id="equipment_provided"
                  name="equipment_provided"
                  rows={3}
                  placeholder="e.g., PA system, microphones, stage lighting, power outlets..."
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 resize-none"
                />
              </div>

              <div>
                <label htmlFor="parking_info" className="block text-lg font-semibold text-gray-700 mb-3">
                  Parking Information
                </label>
                <input
                  id="parking_info"
                  name="parking_info"
                  type="text"
                  placeholder="e.g., Free parking available, Street parking, Valet service..."
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="additional_notes" className="block text-lg font-semibold text-gray-700 mb-3">
                  Additional Notes
                </label>
                <textarea
                  id="additional_notes"
                  name="additional_notes"
                  rows={4}
                  placeholder="Any other important information musicians should know..."
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 resize-none"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t-2 border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/events')}
                className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold text-lg"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                    Posting Event...
                  </div>
                ) : (
                  'Post Event'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


