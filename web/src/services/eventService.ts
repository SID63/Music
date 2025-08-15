import { supabase } from '../lib/supabaseClient';

export interface Event {
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
  created_at: string;
  organizer_profile_id: string;
  band_id?: string;
  posted_by_type?: 'individual' | 'band';
  organizer?: {
    id: string;
    display_name: string | null;
  };
  band?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface EventApplication {
  id: string;
  event_id: string;
  musician_profile_id: string;
  quotation: number;
  additional_requirements?: string;
  created_at: string;
  updated_at?: string;
  status?: 'pending' | 'accepted' | 'declined' | 'confirmed' | 'cancelled' | 'completed';
  band_id?: string;
  applied_by_type?: 'individual' | 'band';
  musician_profile: {
    id: string;
    display_name: string;
    bio?: string;
    rating?: number;
    genres?: string[];
  };
  band?: {
    id: string;
    name: string;
    description?: string;
  };
  event: Event;
}

export const eventService = {
  // Get all events with organizer and band information
  async getEvents(): Promise<{ data: Event[]; error: any }> {
    const { data, error } = await supabase
      .from('events')
      .select(`
        id, title, description, location, event_type, genres, 
        starts_at, ends_at, budget_min, budget_max, 
        contact_email, contact_phone, requirements, 
        equipment_provided, parking_info, additional_notes, created_at,
        organizer_profile_id, band_id, posted_by_type
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

    // Load band data for events posted by bands
    const bandIds = [...new Set(data.filter(e => e.band_id).map(e => e.band_id!))];
    let bandsData: any[] = [];
    
    if (bandIds.length > 0) {
      const { data: bands } = await supabase
        .from('bands')
        .select('id, name, description')
        .in('id', bandIds);
      bandsData = bands || [];
    }

    const eventsWithDetails = data.map(event => ({
      ...event,
      organizer: organizerProfiles?.find(p => p.id === event.organizer_profile_id),
      band: bandsData.find(b => b.id === event.band_id)
    }));

    return { data: eventsWithDetails, error: null };
  },

  // Get events for a specific user (as organizer or band leader)
  async getUserEvents(userId: string): Promise<{ data: Event[]; error: any }> {
    // Get events where user is the organizer
    const { data: individualEvents, error: individualError } = await supabase
      .from('events')
      .select(`
        id, title, description, location, event_type, genres, 
        starts_at, ends_at, budget_min, budget_max, 
        contact_email, contact_phone, requirements, 
        equipment_provided, parking_info, additional_notes, created_at,
        organizer_profile_id, band_id, posted_by_type
      `)
      .eq('organizer_profile_id', userId)
      .eq('posted_by_type', 'individual')
      .order('starts_at', { ascending: true });

    if (individualError) {
      return { data: [], error: individualError };
    }

    // Get events where user is a band leader
    const { data: bandMemberships, error: bandError } = await supabase
      .from('band_members')
      .select('band_id')
      .eq('user_id', userId)
      .eq('role', 'leader');

    if (bandError) {
      return { data: [], error: bandError };
    }

    let bandEvents: any[] = [];
    if (bandMemberships && bandMemberships.length > 0) {
      const bandIds = bandMemberships.map(bm => bm.band_id);
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select(`
          id, title, description, location, event_type, genres, 
          starts_at, ends_at, budget_min, budget_max, 
          contact_email, contact_phone, requirements, 
          equipment_provided, parking_info, additional_notes, created_at,
          organizer_profile_id, band_id, posted_by_type
        `)
        .in('band_id', bandIds)
        .eq('posted_by_type', 'band')
        .order('starts_at', { ascending: true });

      if (!eventsError) {
        bandEvents = events || [];
      }
    }

    // Combine and load additional details
    const allEvents = [...(individualEvents || []), ...bandEvents];
    
    if (allEvents.length === 0) {
      return { data: [], error: null };
    }

    // Load organizer profiles
    const organizerIds = [...new Set(allEvents.map(e => e.organizer_profile_id))];
    const { data: organizerProfiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', organizerIds);

    // Load band data
    const bandIds = [...new Set(allEvents.filter(e => e.band_id).map(e => e.band_id!))];
    let bandsData: any[] = [];
    
    if (bandIds.length > 0) {
      const { data: bands } = await supabase
        .from('bands')
        .select('id, name, description')
        .in('id', bandIds);
      bandsData = bands || [];
    }

    const eventsWithDetails = allEvents.map(event => ({
      ...event,
      organizer: organizerProfiles?.find(p => p.id === event.organizer_profile_id),
      band: bandsData.find(b => b.id === event.band_id)
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
      .select('id, event_id, musician_profile_id, quotation, additional_requirements, created_at, status, band_id, applied_by_type')
      .in('event_id', eventIds);

    if (error || !bookings) {
      return { data: [], error };
    }

    // Load musician profiles
    const musicianIds = [...new Set(bookings.map(b => b.musician_profile_id))];
    const { data: musicianProfiles } = await supabase
      .from('profiles')
      .select('id, display_name, bio, rating, genres')
      .in('id', musicianIds);

    // Load band data for band applications
    const bandIds = [...new Set(bookings.filter(b => b.band_id).map(b => b.band_id!))];
    let bandsData: any[] = [];
    
    if (bandIds.length > 0) {
      const { data: bands } = await supabase
        .from('bands')
        .select('id, name, description')
        .in('id', bandIds);
      bandsData = bands || [];
    }

    const applications = bookings.map(booking => {
      const profile = musicianProfiles?.find(p => p.id === booking.musician_profile_id);
      const event = events.find(e => e.id === booking.event_id);
      const band = bandsData.find(b => b.id === booking.band_id);

      return {
        ...booking,
        updated_at: (booking as any).updated_at || booking.created_at,
        musician_profile: profile || {
          id: booking.musician_profile_id,
          display_name: 'Unknown Musician',
          bio: undefined,
          rating: undefined,
          genres: undefined
        },
        band: band || undefined,
        event: event || {
          id: booking.event_id,
          title: 'Unknown Event',
          description: null,
          location: null,
          event_type: null,
          genres: null,
          starts_at: 'Unknown Date',
          ends_at: null,
          budget_min: null,
          budget_max: null,
          contact_email: null,
          contact_phone: null,
          requirements: null,
          equipment_provided: null,
          parking_info: null,
          additional_notes: null,
          created_at: '',
          organizer_profile_id: '',
          band_id: undefined,
          posted_by_type: undefined,
          organizer: undefined,
          band: undefined
        }
      };
    });

    return { data: applications, error: null };
  },

  // Create a new event
  async createEvent(eventData: any): Promise<{ data: Event | null; error: any }> {
    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();

    return { data, error };
  },

  // Update an event
  async updateEvent(eventId: string, eventData: any): Promise<{ data: Event | null; error: any }> {
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
  async updateApplicationStatus(applicationId: string, status: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', applicationId);

    return { error };
  }
};
