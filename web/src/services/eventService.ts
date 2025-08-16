import { supabase } from '../lib/supabaseClient';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  budget_min: number | null;
  budget_max: number | null;
  created_at: string;
  organizer_profile_id: string;
  organizer?: {
    id: string;
    display_name: string | null;
  };
}

export interface EventApplication {
  id: string;
  event_id: string;
  musician_profile_id: string;
  created_at: string;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  status?: 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'completed';
  musician_profile: {
    id: string;
    display_name: string;
    bio?: string | null;
    genres?: string[] | null;
  };
  event: Event;
}

export const eventService = {
  // Get all events with organizer and band information
  async getEvents(): Promise<{ data: Event[]; error: any }> {
    const { data, error } = await supabase
      .from('events')
      .select(`
        id, title, description, location,
        starts_at, ends_at, budget_min, budget_max,
        created_at, organizer_profile_id
      `)
      .order('starts_at', { ascending: true });

    if (error || !data) {
      return { data: [], error };
    }

    // Load organizer profiles
    const organizerIds = [...new Set(data.map(e => e.organizer_profile_id))];
    const { data: organizerProfiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', organizerIds);

    const eventsWithDetails = data.map(event => ({
      ...event,
      organizer: organizerProfiles?.find(p => p.id === event.organizer_profile_id),
    }));

    return { data: eventsWithDetails, error: null };
  },

  // Get events for a specific user (as organizer or band leader)
  async getUserEvents(userId: string): Promise<{ data: Event[]; error: any }> {
    // Get events where user is the organizer (based on organizer_profile_id)
    const { data: individualEvents, error: individualError } = await supabase
      .from('events')
      .select(`
        id, title, description, location,
        starts_at, ends_at, budget_min, budget_max,
        created_at, organizer_profile_id
      `)
      .eq('organizer_profile_id', userId)
      .order('starts_at', { ascending: true });

    if (individualError) {
      return { data: [], error: individualError };
    }
    // Only organizer-owned events in current schema
    const allEvents = [...(individualEvents || [])];
    
    if (allEvents.length === 0) {
      return { data: [], error: null };
    }

    // Load organizer profiles
    const organizerIds = [...new Set(allEvents.map(e => e.organizer_profile_id))];
    const { data: organizerProfiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', organizerIds);

    const eventsWithDetails = allEvents.map(event => ({
      ...event,
      organizer: organizerProfiles?.find(p => p.id === event.organizer_profile_id),
    }));

    return { data: eventsWithDetails, error: null };
  },

  // Get applications for events (for organizers and band leaders)
  async getEventApplications(events: Event[]): Promise<{ data: EventApplication[]; error: any }> {
    if (events.length === 0) {
      return { data: [], error: null };
    }

    const eventIds = events.map(e => e.id);
    
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, event_id, musician_profile_id, created_at, status, scheduled_start, scheduled_end')
      .in('event_id', eventIds);

    if (error || !bookings) {
      return { data: [], error };
    }

    // Load musician profiles
    const musicianIds = [...new Set(bookings.map(b => b.musician_profile_id))];
    const { data: musicianProfiles } = await supabase
      .from('profiles')
      .select('id, display_name, bio, genres')
      .in('id', musicianIds);

    const applications: EventApplication[] = bookings.map(booking => {
      const foundProfile = musicianProfiles?.find(p => p.id === booking.musician_profile_id);
      const profile = foundProfile
        ? {
            id: foundProfile.id,
            display_name: foundProfile.display_name ?? 'Unknown Musician',
            bio: foundProfile.bio ?? null,
            genres: foundProfile.genres ?? null,
          }
        : {
            id: booking.musician_profile_id,
            display_name: 'Unknown Musician',
            bio: null,
            genres: null,
          };

      const event = events.find(e => e.id === booking.event_id) || {
        id: booking.event_id,
        title: 'Unknown Event',
        description: null,
        location: null,
        starts_at: 'Unknown Date',
        ends_at: null,
        budget_min: null,
        budget_max: null,
        created_at: '',
        organizer_profile_id: '',
        organizer: undefined,
      } as Event;

      return {
        id: booking.id,
        event_id: booking.event_id,
        musician_profile_id: booking.musician_profile_id,
        created_at: booking.created_at,
        scheduled_start: booking.scheduled_start ?? null,
        scheduled_end: booking.scheduled_end ?? null,
        status: booking.status as EventApplication['status'],
        musician_profile: profile,
        event,
      };
    });

    return { data: applications, error: null };
  },

  // Create a new event
  async createEvent(eventData: any): Promise<{ data: Event | null; error: any }> {
    // Defensive validation: if ends_at is provided, it must be strictly after starts_at
    try {
      if (eventData?.starts_at) {
        const start = new Date(eventData.starts_at);
        if (Number.isNaN(start.getTime())) {
          return { data: null, error: { message: 'Invalid starts_at' } };
        }
        if (!eventData?.ends_at) {
          return { data: null, error: { message: 'End time is required' } };
        }
        if (eventData?.ends_at) {
          const end = new Date(eventData.ends_at);
          if (Number.isNaN(end.getTime())) {
            return { data: null, error: { message: 'Invalid ends_at' } };
          }
          if (end <= start) {
            return { data: null, error: { message: 'End time must be after start time' } };
          }
        }
      }
    } catch (_) {
      return { data: null, error: { message: 'Invalid date values' } };
    }
    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();

    return { data, error };
  },

  // Update an event
  async updateEvent(eventId: string, eventData: any): Promise<{ data: Event | null; error: any }> {
    // Defensive validation: maintain invariant ends_at > starts_at when both provided
    try {
      const startValue = eventData?.starts_at;
      const endValue = eventData?.ends_at;
      if (startValue || endValue) {
        // When updating time fields, require both start and end to be provided together
        if (!(startValue && endValue)) {
          return { data: null, error: { message: 'Both start and end times are required when updating times' } };
        }
        if (startValue && endValue) {
          const start = new Date(startValue);
          const end = new Date(endValue);
          if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return { data: null, error: { message: 'Invalid date values' } };
          }
          if (end <= start) {
            return { data: null, error: { message: 'End time must be after start time' } };
          }
        }
      }
    } catch (_) {
      return { data: null, error: { message: 'Invalid date values' } };
    }
    const { data, error } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', eventId)
      .select()
      .single();

    return { data, error };
  },

  // Delete an event
  async deleteEvent(eventId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    return { error };
  },

  // Apply for an event
  async applyForEvent(applicationData: any): Promise<{ data: any; error: any }> {
    const { data, error } = await supabase
      .from('bookings')
      .insert(applicationData)
      .select()
      .single();

    return { data, error };
  },

  // Update application status
  async updateApplicationStatus(
    applicationId: string,
    status: NonNullable<EventApplication['status']>
  ): Promise<{ error: any }> {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', applicationId);

    return { error };
  }
};
