import { supabase } from '../lib/supabaseClient';

export type JobApplication = {
  id: string;
  event_id: string;
  musician_profile_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  scheduled_start: string | null;
  scheduled_end: string | null;
  quotation: number | null;
  created_at: string;
};

export const jobService = {
  // Apply for a job (create a booking) with quotation
  async applyForJob(eventId: string, quotation?: number): Promise<{ data: JobApplication | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, price_min, price_max')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return { data: null, error: 'Profile not found' };
    }

    // Check if already applied
    const { data: existingApplication } = await supabase
      .from('bookings')
      .select('id')
      .eq('event_id', eventId)
      .eq('musician_profile_id', profile.id)
      .single();

    if (existingApplication) {
      return { data: null, error: 'You have already applied for this job' };
    }

    // Get event details for the message
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        location,
        starts_at,
        ends_at,
        budget_min,
        budget_max,
        organizer_profile_id
      `)
      .eq('id', eventId)
      .single();

    if (eventError || !eventData) {
      return { data: null, error: 'Event not found' };
    }

    // Create the booking
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        event_id: eventId,
        musician_profile_id: profile.id,
        status: 'pending',
        quotation: quotation || null
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    // Send automatic message to event organizer
    try {
      const messageContent = this.createApplicationMessage(profile, eventData, quotation);
      
      await supabase
        .from('messages')
        .insert({
          sender_profile_id: profile.id,
          recipient_profile_id: eventData.organizer_profile_id,
          topic: `Job Application: ${eventData.title}`,
          content: messageContent,
          extension: 'job_application',
          event: eventId,
          payload: {
            event_id: eventId,
            application_id: data.id,
            quotation: quotation,
            event_title: eventData.title,
            event_date: eventData.starts_at
          }
        });
    } catch (messageError) {
      console.error('Failed to send application message:', messageError);
      // Don't fail the application if message fails
    }

    return { data, error: null };
  },

  // Create application message content
  createApplicationMessage(musicianProfile: any, eventData: any, quotation?: number): string {
    const eventDate = new Date(eventData.starts_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let message = `Hi! I'm interested in your event "${eventData.title}" on ${eventDate}.\n\n`;
    
    if (eventData.location) {
      message += `📍 Location: ${eventData.location}\n`;
    }
    
    if (quotation) {
      message += `💰 My quotation: ₹${quotation}\n`;
    } else if (musicianProfile.price_min && musicianProfile.price_max) {
      message += `💰 My rate range: ₹${musicianProfile.price_min} - ₹${musicianProfile.price_max}\n`;
    }
    
    message += `\nI'd love to discuss the details and see if we're a good fit for your event. Please let me know if you have any questions!\n\n`;
    message += `Best regards,\n${musicianProfile.display_name || 'Musician'}`;
    
    return message;
  },

  // Get job applications for a musician
  async getMyApplications(): Promise<{ data: JobApplication[]; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: 'Not authenticated' };

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return { data: [], error: 'Profile not found' };
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('musician_profile_id', profile.id)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  },

  // Get job applications for an event (organizer view)
  async getEventApplications(eventId: string): Promise<{ data: JobApplication[]; error: any }> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  },

  // Update application status (organizer action)
  async updateApplicationStatus(
    applicationId: string, 
    status: 'accepted' | 'rejected' | 'completed',
    scheduledStart?: string,
    scheduledEnd?: string
  ): Promise<{ data: any; error: any }> {
    const updateData: any = { status };
    
    if (scheduledStart) updateData.scheduled_start = scheduledStart;
    if (scheduledEnd) updateData.scheduled_end = scheduledEnd;

    const { error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', applicationId);

    return { data: null, error };
  },

  // Withdraw application (musician action)
  async withdrawApplication(applicationId: string): Promise<{ data: any; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return { data: null, error: 'Profile not found' };
    }

    // Delete the booking
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', applicationId)
      .eq('musician_profile_id', profile.id);

    return { data: null, error };
  }
};
