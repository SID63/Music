import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import BandActionSelector from './BandActionSelector';

interface Event {
  id: string;
  title: string;
  starts_at: string;
  location?: string;
  budget_min?: number;
  budget_max?: number;
}

interface EventApplicationFormProps {
  event: Event;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

const EventApplicationForm: React.FC<EventApplicationFormProps> = ({
  event,
  onSuccess,
  onCancel,
  className = ""
}) => {
  const { profile } = useAuth();
  const [showActionSelector, setShowActionSelector] = useState(true);
  const [selectedActionType, setSelectedActionType] = useState<'individual' | 'band'>('individual');
  const [selectedBandId, setSelectedBandId] = useState<string | undefined>(undefined);
  const [quotation, setQuotation] = useState<number>(0);
  const [additionalRequirements, setAdditionalRequirements] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActionSelect = (actionType: 'individual' | 'band', bandId?: string) => {
    console.log('Action selected:', actionType, 'Band ID:', bandId);
    setSelectedActionType(actionType);
    setSelectedBandId(bandId);
    setShowActionSelector(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) {
      setError('You must be logged in to apply for events');
      return;
    }

    // Don't proceed if action selector is currently shown
    if (showActionSelector) {
      console.log('Action selector is shown, ignoring form submission');
      return;
    }

    if (quotation <= 0) {
      setError('Please enter a valid quotation amount');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Submitting application with:', {
        actionType: selectedActionType,
        bandId: selectedBandId,
        quotation,
        eventId: event.id
      });

      // Prepare booking data based on action type
      const bookingData: any = {
        event_id: event.id,
        musician_profile_id: profile.id,
        quotation: quotation,
        additional_requirements: additionalRequirements.trim() || null,
        applied_by_type: selectedActionType,
      };

      // Add band-specific data if applying as a band
      if (selectedActionType === 'band' && selectedBandId) {
        bookingData.band_id = selectedBandId;
      }

      console.log('Booking data to insert:', bookingData);

      const { error: insertError } = await supabase
        .from('bookings')
        .insert(bookingData);

      if (insertError) {
        setError(insertError.message);
      } else {
        // Success
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show action selector if needed
  if (showActionSelector) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BandActionSelector
            onSelect={handleActionSelect}
            title="Apply As"
            description="Choose whether to apply for this event as an individual or as a band leader"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Apply for Event</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Submit your application to be considered for this event
          </p>
          {selectedActionType === 'band' && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-xl">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-purple-800 font-semibold">Applying as Band</span>
            </div>
          )}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Application Details</h2>
            <p className="text-blue-100">Fill in your application details below</p>
          </div>
          
          <div className="p-8">
            {/* Event Information */}
            <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h3>
              <div className="space-y-2 text-gray-700">
                <div className="font-medium text-lg">{event.title}</div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span>{event.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span>{new Date(event.starts_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
                {event.budget_min && event.budget_max && (
                  <div className="flex items-center gap-2">
                    <span>💰</span>
                    <span>Budget: ${event.budget_min} - ${event.budget_max}</span>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
                  <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              {/* Quotation */}
              <div>
                <label htmlFor="quotation" className="block text-lg font-semibold text-gray-700 mb-3">
                  Your Quotation ($) <span className="text-red-500">*</span>
                </label>
                <input
                  id="quotation"
                  type="number"
                  min="1"
                  value={quotation}
                  onChange={(e) => setQuotation(Number(e.target.value))}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-lg font-medium text-foreground placeholder:text-foreground/70"
                  placeholder="Enter your quote amount"
                  required
                />
                {event.budget_min && event.budget_max && (
                  <p className="mt-2 text-sm text-gray-500">
                    Event budget: ${event.budget_min} - ${event.budget_max}
                  </p>
                )}
              </div>

              {/* Additional Requirements */}
              <div>
                <label htmlFor="additionalRequirements" className="block text-lg font-semibold text-gray-700 mb-3">
                  Additional Requirements or Notes
                </label>
                <textarea
                  id="additionalRequirements"
                  value={additionalRequirements}
                  onChange={(e) => setAdditionalRequirements(e.target.value)}
                  rows={4}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 resize-none text-foreground placeholder:text-foreground/70 font-medium"
                  placeholder="Any additional requirements, equipment needs, or special requests..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-6 border-t-2 border-gray-100">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold text-lg"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                      Submitting Application...
                    </div>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventApplicationForm;
