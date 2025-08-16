import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const SimpleEventForm: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!profile) {
      setError('You must be logged in to create events');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const form = new FormData(e.currentTarget);
      
      const title = String(form.get('title') || '').trim();
      const description = String(form.get('description') || '');
      const location = String(form.get('location') || '');
      const startsAt = String(form.get('starts_at') || '');
      let endsAt = String(form.get('ends_at') || '');
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
      
      const startDate = new Date(startsAt);
      if (startDate <= new Date()) {
        setError('Start date must be in the future');
        return;
      }

      // Ensure endsAt exists and is after start
      if (!endsAt) {
        setError('End date and time is required');
        return;
      }
      const endDate = new Date(endsAt);
      if (endDate <= startDate) {
        setError('End date must be after start date');
        return;
      }

      // Get authenticated user's email
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.warn('Could not get auth user:', authError.message);
      }

      const eventData = {
        organizer_profile_id: profile.id,
        title: title,
        description: description,
        location: location,
        event_type: 'gig',
        genres: ['general'],
        starts_at: startDate.toISOString(),
        ends_at: endDate.toISOString(),
        budget_min: budgetMin,
        budget_max: budgetMax,
        contact_email: user?.email || '',
        contact_phone: '',
        requirements: '',
        equipment_provided: '',
        parking_info: '',
        additional_notes: '',
        posted_by_type: 'individual'
      };

      console.log('Attempting to create event with data:', eventData);
      
      const { data, error: insertError } = await supabase
        .from('events')
        .insert(eventData)
        .select();

      console.log('Insert result:', { data, error: insertError });

      if (insertError) {
        console.error('Event creation error:', insertError);
        setError(insertError.message);
      } else {
        console.log('Event created successfully:', data);
        alert('Event created successfully!');
        navigate('/events');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Create Event (Simple Form)</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Title *
          </label>
          <input
            name="title"
            type="text"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter event title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe your event"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            name="location"
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Event location"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date & Time *
          </label>
          <input
            name="starts_at"
            type="datetime-local"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => {
              const endsInput = document.getElementsByName('ends_at')[0] as HTMLInputElement | undefined;
              if (endsInput && e.target.value) {
                endsInput.min = e.target.value;
                endsInput.setCustomValidity('');
              }
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date & Time *
          </label>
          <input
            name="ends_at"
            type="datetime-local"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => {
              const endDate = new Date(e.target.value);
              const startInput = document.getElementsByName('starts_at')[0] as HTMLInputElement | undefined;
              if (startInput && startInput.value && endDate <= new Date(startInput.value)) {
                e.target.setCustomValidity('End date must be after start date');
              } else {
                e.target.setCustomValidity('');
              }
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Budget (₹)
            </label>
            <input
              name="budget_min"
              type="number"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Budget (₹)
            </label>
            <input
              name="budget_max"
              type="number"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SimpleEventForm;
