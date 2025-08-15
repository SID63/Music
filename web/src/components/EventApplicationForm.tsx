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
      <div className={className}>
        <BandActionSelector
          onSelect={handleActionSelect}
          title="Apply As"
          description="Choose whether to apply for this event as an individual or as a band leader"
        />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Apply for Event</h3>
        <div className="text-sm text-gray-600">
          <div className="font-medium">{event.title}</div>
          <div>{event.location && `📍 ${event.location}`}</div>
          <div>{new Date(event.starts_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
          {selectedActionType === 'band' && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <span className="font-medium">Applying as Band:</span> You're applying on behalf of your band
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="quotation" className="block text-sm font-medium text-gray-700 mb-2">
            Your Quotation ($) *
          </label>
          <input
            id="quotation"
            type="number"
            min="1"
            value={quotation}
            onChange={(e) => setQuotation(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Enter your quote amount"
            required
          />
          {event.budget_min && event.budget_max && (
            <p className="mt-1 text-sm text-gray-500">
              Event budget: ${event.budget_min} - ${event.budget_max}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="additionalRequirements" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Requirements or Notes
          </label>
          <textarea
            id="additionalRequirements"
            value={additionalRequirements}
            onChange={(e) => setAdditionalRequirements(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Any additional requirements, equipment needs, or special requests..."
          />
        </div>

        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventApplicationForm;
