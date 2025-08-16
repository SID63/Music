import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, MapPin, Music, User, Users, X, Plus, Trash2, Upload, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import BandActionSelector from '../components/BandActionSelector';

// Add missing type declarations
declare module 'uuid' {
  export function v4(): string;
}

// Helper: format to input[type="datetime-local"] expected local format (YYYY-MM-DDTHH:MM)
function formatForDatetimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${mi}`;
}

export default function EventPostForm() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showActionSelector, setShowActionSelector] = useState(true); // Start with action selector
  const [selectedActionType, setSelectedActionType] = useState<'individual' | 'band'>('individual');
  const [selectedBandId, setSelectedBandId] = useState<string | undefined>(undefined);
  const [startsAtValue, setStartsAtValue] = useState<string>('');

  const handleActionSelect = (actionType: 'individual' | 'band', bandId?: string) => {
    console.log('Action selected:', actionType, 'Band ID:', bandId);
    setSelectedActionType(actionType);
    setSelectedBandId(bandId);
    setShowActionSelector(false);
    console.log('Action selector hidden, showing form for:', actionType, 'Band ID:', bandId);
    
    // Force a re-render to ensure the form updates with the selected band
    window.scrollTo(0, 0);
  };

  const validateForm = (formData: FormData): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    const requiredFields = ['title', 'location', 'starts_at', 'ends_at'];
    
    requiredFields.forEach(field => {
      if (!formData.get(field)) {
        errors[field] = 'This field is required';
      }
    });

    const startsAt = formData.get('starts_at') ? new Date(formData.get('starts_at') as string) : null;
    const endsAt = formData.get('ends_at') ? new Date(formData.get('ends_at') as string) : null;
    
    if (startsAt && startsAt < new Date()) {
      errors.starts_at = 'Start date cannot be in the past';
    }
    
    if (startsAt && endsAt && endsAt <= startsAt) {
      errors.ends_at = 'End date must be after start date';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!profile || (profile.role !== 'organizer' && profile.role !== 'musician')) {
      toast.error('You must be logged in as an organizer or musician to post events');
      return;
    }
    
    if (showActionSelector) {
      toast.error('Please select how you want to post this event');
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    const { isValid, errors } = validateForm(formData);
    
    if (!isValid) {
      Object.entries(errors).forEach(([field, error]) => {
        toast.error(`${field}: ${error}`);
      });
      return;
    }
    
    console.log('Action type selected:', selectedActionType, 'Band ID:', selectedBandId);
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (!profile) {
        throw new Error('No user profile found');
      }
      
      // Get form values
      // Get and validate form values with proper type assertions
      const title = formData.get('title')?.toString() || '';
      const description = formData.get('description')?.toString() || '';
      const location = formData.get('location')?.toString() || '';
      const startsAt = formData.get('starts_at')?.toString() || '';
      let endsAt = formData.get('ends_at')?.toString() || null;
      const budgetMin = formData.get('budget_min')?.toString();
      const budgetMax = formData.get('budget_max')?.toString();
      
      if (!title) {
        throw new Error('Event title is required');
      }
      
      if (!startsAt) {
        throw new Error('Start date and time is required');
      }
      
      // Check if start date is in the future
      const startDate = new Date(startsAt);
      if (startDate <= new Date()) {
        setError('Start date must be in the future');
        return;
      }
      
      // Ensure end date exists and is after start date
      if (!endsAt) {
        setError('End date and time is required');
        return;
      }
      const endDate = new Date(endsAt);
      if (endDate <= startDate) {
        setError('End date must be after start date');
        return;
      }
      
      const budgetMinNum = budgetMin ? parseInt(budgetMin, 10) : 0;
      const budgetMaxNum = budgetMax ? parseInt(budgetMax, 10) : 0;
      
      if (budgetMin && budgetMax && budgetMinNum > budgetMaxNum) {
        setError('Minimum budget cannot be greater than maximum budget');
        return;
      }
      
      // Prepare event data for submission
      const eventData = {
        title,
        description: description || null,
        location: location || null,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        organizer_profile_id: profile.id,
        posted_by_type: selectedActionType,
        budget_min: budgetMinNum || null,
        budget_max: budgetMaxNum || null,
        event_type: 'gig',
        ...(selectedActionType === 'band' && selectedBandId ? { band_id: selectedBandId } : {}),
      };
      
      const { data, error: insertError } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();
      
      if (insertError) {
        throw new Error(insertError.message || 'Failed to create event');
      }
      
      toast.success('Event created successfully!');
      navigate(`/events/${data.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
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
      <div className="min-h-screen bg-gray-50">
        <BandActionSelector
          onSelect={handleActionSelect}
          showHeader
          title="Post Event As"
          description="Choose whether to post this event as an individual or as a band leader"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Post a New Event</h1>
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
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 sm:px-8 py-5 sm:py-6">
            <h2 className="text-2xl font-bold text-white">Event Details</h2>
            <p className="text-blue-100">Fill in the information below to create your event listing</p>
          </div>
          
          <form onSubmit={onSubmit} className="p-6 sm:p-8 space-y-6 sm:space-y-8">
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
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-lg min-h-12 text-foreground placeholder:text-foreground/70 font-medium"
                  autoComplete="off"
                  inputMode="text"
                  required
                  aria-required="true"
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
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 resize-none text-foreground placeholder:text-foreground/70 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="event_type" className="block text-lg font-semibold text-gray-700 mb-3">
                    Event Type
                  </label>
                  <select
                    id="event_type"
                    name="event_type"
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 min-h-12 text-foreground placeholder:text-foreground/70 font-medium"
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
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 min-h-12 text-foreground placeholder:text-foreground/70 font-medium"
                    inputMode="text"
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
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 min-h-12 text-foreground placeholder:text-foreground/70 font-medium"
                  autoComplete="street-address"
                  inputMode="text"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="starts_at" className="block text-lg font-semibold text-gray-700 mb-3">
                    Start Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="starts_at"
                    name="starts_at"
                    type="datetime-local"
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 min-h-12 text-foreground placeholder:text-foreground/70 font-medium"
                    min={formatForDatetimeLocal(new Date())}
                    required
                    aria-required="true"
                    aria-describedby="starts_at_help"
                    onChange={(e) => setStartsAtValue(e.target.value)}
                  />
                  <p id="starts_at_help" className="mt-2 text-sm text-gray-500">Start must be in the future.</p>
                </div>

                <div>
                  <label htmlFor="ends_at" className="block text-lg font-semibold text-gray-700 mb-3">
                    End Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="ends_at"
                    name="ends_at"
                    type="datetime-local"
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 min-h-12 text-foreground placeholder:text-foreground/70 font-medium"
                    min={(startsAtValue || formatForDatetimeLocal(new Date()))}
                    required
                    aria-required="true"
                    aria-describedby="ends_at_help"
                  />
                  <p id="ends_at_help" className="mt-2 text-sm text-gray-500">End must be after start.</p>
                </div>
              </div>
            </div>

            {/* Budget & Compensation */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Budget & Compensation</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="budget_min" className="block text-lg font-semibold text-gray-700 mb-3">
                    Minimum Budget (₹)
                  </label>
                  <input
                    id="budget_min"
                    name="budget_min"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="0"
                    placeholder="e.g., 200"
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-yellow-100 focus:border-yellow-500 transition-all duration-200 min-h-12 text-foreground placeholder:text-foreground/70 font-medium"
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
                    Maximum Budget (₹)
                  </label>
                  <input
                    id="budget_max"
                    name="budget_max"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="0"
                    placeholder="e.g., 1000"
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-yellow-100 focus:border-yellow-500 transition-all duration-200 min-h-12 text-foreground placeholder:text-foreground/70 font-medium"
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
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 min-h-12 text-foreground placeholder:text-foreground/70 font-medium"
                    inputMode="email"
                    autoComplete="email"
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
                    inputMode="tel"
                    placeholder="(555) 123-4567"
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 min-h-12 text-foreground placeholder:text-foreground/70 font-medium"
                    autoComplete="tel"
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
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 resize-none text-foreground placeholder:text-foreground/70 font-medium"
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
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 resize-none text-foreground placeholder:text-foreground/70 font-medium"
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
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-foreground placeholder:text-foreground/70 font-medium"
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
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 resize-none text-foreground placeholder:text-foreground/70 font-medium"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 sm:pt-8 border-t-2 border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/events')}
                className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold text-lg w-full sm:w-auto min-h-12"
                aria-label="Cancel and go back to events"
              >
                Cancel
              </button>
              
              <Button 
                type="submit" 
                className="w-full sm:w-auto min-h-12" 
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Event...
                  </>
                ) : 'Create Event'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


