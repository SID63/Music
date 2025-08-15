import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

type Event = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  event_type: string | null;
  genres: string[] | null;
  starts_at: string;
  ends_at: string | null;
  budget_min: number | null;
  budget_max: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  requirements: string | null;
  equipment_provided: string | null;
  parking_info: string | null;
  additional_notes: string | null;
  organizer_profile_id: string;
};

export default function EventEditPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    event_type: 'gig',
    genres: '',
    starts_at: '',
    ends_at: '',
    budget_min: '',
    budget_max: '',
    contact_email: '',
    contact_phone: '',
    requirements: '',
    equipment_provided: '',
    parking_info: '',
    additional_notes: ''
  });

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    if (!eventId || !profile) return;

    try {
      // First, check if there are any confirmed bookings for this event
      const { data: confirmedBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('event_id', eventId)
        .in('status', ['confirmed', 'completed']);

      if (bookingsError) {
        console.error('Error checking bookings:', bookingsError);
      }

      // If there are confirmed bookings, prevent editing
      if (confirmedBookings && confirmedBookings.length > 0) {
        alert('This event cannot be edited because artists have already confirmed their participation. Please contact the confirmed artists if you need to make changes.');
        navigate('/events');
        return;
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('organizer_profile_id', profile.id)
        .single();

      if (error) {
        alert('Event not found or you do not have permission to edit it');
        navigate('/events');
        return;
      }

      setEvent(data);
      setFormData({
        title: data.title,
        description: data.description || '',
        location: data.location || '',
        event_type: data.event_type || 'gig',
        genres: data.genres ? data.genres.join(', ') : '',
        starts_at: new Date(data.starts_at).toISOString().slice(0, 16),
        ends_at: data.ends_at ? new Date(data.ends_at).toISOString().slice(0, 16) : '',
        budget_min: data.budget_min?.toString() || '',
        budget_max: data.budget_max?.toString() || '',
        contact_email: data.contact_email || '',
        contact_phone: data.contact_phone || '',
        requirements: data.requirements || '',
        equipment_provided: data.equipment_provided || '',
        parking_info: data.parking_info || '',
        additional_notes: data.additional_notes || ''
      });
    } catch (error) {
      console.error('Error loading event:', error);
      alert('Failed to load event');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !profile) return;

    setSaving(true);
    try {
      // Double-check that no bookings have been confirmed since the page loaded
      const { data: confirmedBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('event_id', eventId)
        .in('status', ['confirmed', 'completed']);

      if (bookingsError) {
        console.error('Error checking bookings:', bookingsError);
      }

      // If there are confirmed bookings, prevent editing
      if (confirmedBookings && confirmedBookings.length > 0) {
        alert('This event cannot be edited because artists have already confirmed their participation. Please contact the confirmed artists if you need to make changes.');
        setSaving(false);
        navigate('/events');
        return;
      }
      // Parse genres as array
      const genres = formData.genres ? formData.genres.split(',').map(g => g.trim()).filter(g => g) : [];
      
      const { error } = await supabase
        .from('events')
        .update({
          title: formData.title,
          description: formData.description || null,
          location: formData.location || null,
          event_type: formData.event_type,
          genres: genres,
          starts_at: formData.starts_at,
          ends_at: formData.ends_at || null,
          budget_min: formData.budget_min ? parseInt(formData.budget_min) : null,
          budget_max: formData.budget_max ? parseInt(formData.budget_max) : null,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
          requirements: formData.requirements || null,
          equipment_provided: formData.equipment_provided || null,
          parking_info: formData.parking_info || null,
          additional_notes: formData.additional_notes || null
        })
        .eq('id', eventId)
        .eq('organizer_profile_id', profile.id);

      if (error) throw error;

      alert('Event updated successfully!');
      navigate('/events');
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Event Not Found</h2>
          <p className="text-gray-600">The event you're looking for doesn't exist or you don't have permission to edit it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Event</h1>
        <p className="text-gray-600">Update your event details to attract the right musicians</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-8 space-y-6">
        {/* Basic Event Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Event Title *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Summer Music Festival, Wedding Reception, Corporate Event"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Event Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your event, the atmosphere you're looking for, and what makes it special..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="event_type" className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <select
                id="event_type"
                value={formData.event_type}
                onChange={(e) => handleInputChange('event_type', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="gig">Gig/Performance</option>
                <option value="wedding">Wedding</option>
                <option value="corporate">Corporate Event</option>
                <option value="festival">Festival</option>
                <option value="party">Private Party</option>
                <option value="ceremony">Ceremony</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="genres" className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Genres
              </label>
              <input
                id="genres"
                type="text"
                value={formData.genres}
                onChange={(e) => handleInputChange('genres', e.target.value)}
                placeholder="e.g., Jazz, Rock, Classical, Pop (comma-separated)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Location and Timing */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Location & Timing</h3>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., Central Park, Grand Hotel, 123 Main Street"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="starts_at" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date & Time *
              </label>
              <input
                id="starts_at"
                type="datetime-local"
                value={formData.starts_at}
                onChange={(e) => handleInputChange('starts_at', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="ends_at" className="block text-sm font-medium text-gray-700 mb-2">
                End Date & Time
              </label>
              <input
                id="ends_at"
                type="datetime-local"
                value={formData.ends_at}
                onChange={(e) => handleInputChange('ends_at', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Budget Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Budget & Compensation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="budget_min" className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Budget ($)
              </label>
              <input
                id="budget_min"
                type="number"
                min="0"
                value={formData.budget_min}
                onChange={(e) => handleInputChange('budget_min', e.target.value)}
                placeholder="e.g., 200"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="budget_max" className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Budget ($)
              </label>
              <input
                id="budget_max"
                type="number"
                min="0"
                value={formData.budget_max}
                onChange={(e) => handleInputChange('budget_max', e.target.value)}
                placeholder="e.g., 1000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email
              </label>
              <input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                id="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Additional Details</h3>
          
          <div>
            <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
              Musician Requirements
            </label>
            <textarea
              id="requirements"
              rows={3}
              value={formData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              placeholder="e.g., Must bring own instruments, Dress code: formal, Experience level required..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="equipment_provided" className="block text-sm font-medium text-gray-700 mb-2">
              Equipment Provided
            </label>
            <textarea
              id="equipment_provided"
              rows={2}
              value={formData.equipment_provided}
              onChange={(e) => handleInputChange('equipment_provided', e.target.value)}
              placeholder="e.g., PA system, microphones, stage lighting, power outlets..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="parking_info" className="block text-sm font-medium text-gray-700 mb-2">
              Parking Information
            </label>
            <input
              id="parking_info"
              type="text"
              value={formData.parking_info}
              onChange={(e) => handleInputChange('parking_info', e.target.value)}
              placeholder="e.g., Free parking available, Street parking, Valet service..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="additional_notes" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              id="additional_notes"
              rows={3}
              value={formData.additional_notes}
              onChange={(e) => handleInputChange('additional_notes', e.target.value)}
              placeholder="Any other important information musicians should know..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
