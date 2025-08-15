import { supabase } from '../lib/supabaseClient';
import type { Band, BandMember, BandRequest } from '../types/band';

export const bandService = {
  // Get all active bands
  async getBands(): Promise<{ data: Band[]; error: any }> {
    const { data, error } = await supabase
      .from('bands')
      .select(`
        *,
        member_count:band_members(count)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Extract the count value from the member_count object
    const processedData = data?.map(band => {
      let memberCount = 0;
      
      // Handle different possible formats of member_count
      if (Array.isArray(band.member_count)) {
        // If it's an array, count the items
        memberCount = band.member_count.length;
      } else if (typeof band.member_count === 'object' && band.member_count?.count) {
        // If it's an object with count property
        memberCount = band.member_count.count;
      } else if (typeof band.member_count === 'number') {
        // If it's already a number
        memberCount = band.member_count;
      }
      
      // Debug logging to help with troubleshooting (commented out to reduce console noise)
      // if (typeof band.member_count !== 'number') {
      //   console.log('Band member_count was processed, extracted count:', {
      //     bandId: band.id,
      //     originalMemberCount: band.member_count,
      //     extractedCount: memberCount,
      //     type: typeof band.member_count,
      //     isArray: Array.isArray(band.member_count)
      //   });
      // }
      
      return {
        ...band,
        member_count: memberCount
      };
    }) || [];

    return { data: processedData, error };
  },

     // Get a specific band with members
   async getBand(bandId: string): Promise<{ data: Band | null; error: any }> {
     // console.log('Getting band with ID:', bandId);
     
     // First get the band details
     const { data: bandData, error: bandError } = await supabase
       .from('bands')
       .select('*')
       .eq('id', bandId)
       .eq('is_active', true)
       .single();

    if (bandError || !bandData) {
      return { data: null, error: bandError };
    }

         // Then get the members separately (without nested query to avoid RLS issues)
     const { data: membersData, error: membersError } = await supabase
       .from('band_members')
       .select('*')
       .eq('band_id', bandId);
     
     // console.log('Band members data:', membersData);
     // console.log('Band members error:', membersError);

                   // If we have members, fetch their profile data separately
     let membersWithProfiles = [];
     if (membersData && membersData.length > 0) {
       // Fetch profiles one by one to avoid potential RLS issues
       const profilesPromises = membersData.map(async (member) => {
         const { data: profileData, error: profileError } = await supabase
           .from('profiles')
           .select('id, user_id, display_name, avatar_url')
           .eq('user_id', member.user_id)
           .single();
         
         // console.log('Profile for user', member.user_id, ':', profileData, 'Error:', profileError);
         
         return {
           ...member,
           user: profileData || { id: member.user_id, display_name: null, avatar_url: null }
         };
       });
       
       membersWithProfiles = await Promise.all(profilesPromises);
     }

    if (membersError) {
      console.error('Error fetching band members:', membersError);
    }

    // Combine the data
    const combinedData = {
      ...bandData,
      members: membersWithProfiles
    };

    return { data: combinedData, error: membersError };
  },

  // Get bands that a user is a member of
  async getUserBands(userId: string): Promise<{ data: Band[]; error: any }> {
    try {
      // First get the user's band memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('band_members')
        .select('band_id, role, joined_at')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      if (membershipsError) {
        console.error('Error fetching band memberships:', membershipsError);
        return { data: [], error: membershipsError };
      }

      if (!memberships || memberships.length === 0) {
        return { data: [], error: null };
      }

      // Get the band IDs
      const bandIds = memberships.map(m => m.band_id);

      // Fetch the bands separately
      const { data: bands, error: bandsError } = await supabase
        .from('bands')
        .select('*')
        .in('id', bandIds)
        .eq('is_active', true);

      if (bandsError) {
        console.error('Error fetching bands:', bandsError);
        return { data: [], error: bandsError };
      }

      // Get member counts for each band
      const bandsWithCounts = await Promise.all(
        (bands || []).map(async (band) => {
          const { count, error: countError } = await supabase
            .from('band_members')
            .select('*', { count: 'exact', head: true })
            .eq('band_id', band.id);

          return {
            ...band,
            member_count: count || 0
          };
        })
      );

      return { 
        data: bandsWithCounts, 
        error: null 
      };
    } catch (error) {
      console.error('Unexpected error in getUserBands:', error);
      return { data: [], error };
    }
  },

  // Create a new band
  async createBand(name: string, description: string): Promise<{ data: Band | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('bands')
      .insert({
        name,
        description,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    if (data) {
      // Add the creator as the leader
      const { error: memberError } = await supabase
        .from('band_members')
        .insert({
          band_id: data.id,
          user_id: user.id,
          role: 'leader'
        });

      if (memberError) {
        console.error('Failed to add band creator as leader:', memberError);
        // Try to delete the band if we can't add the creator as leader
        await supabase
          .from('bands')
          .delete()
          .eq('id', data.id);
        return { data: null, error: memberError };
      }
    }

    return { data, error: null };
  },

  // Send a request to join a band
  async sendJoinRequest(bandId: string, message?: string): Promise<{ data: BandRequest | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('band_requests')
      .insert({
        band_id: bandId,
        requester_id: user.id,
        request_type: 'musician_to_band',
        message
      })
      .select()
      .single();

    return { data, error };
  },

  // Send a request to invite a musician to a band
  async sendInviteRequest(bandId: string, musicianId: string, message?: string): Promise<{ data: BandRequest | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('band_requests')
      .insert({
        band_id: bandId,
        requester_id: musicianId,
        request_type: 'band_to_musician',
        message
      })
      .select()
      .single();

    return { data, error };
  },

  // Get pending requests for a user
  async getPendingRequests(): Promise<{ data: BandRequest[]; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('band_requests')
      .select('*')
      .eq('requester_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return { data: [], error };
    }

    // Fetch band and requester data separately
    const requestsWithDetails = await Promise.all(
      data.map(async (request) => {
        // Get band details
        const { data: bandData } = await supabase
          .from('bands')
          .select('*')
          .eq('id', request.band_id)
          .single();

        // Get requester profile
        const { data: requesterData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .eq('user_id', request.requester_id)
          .single();

        return {
          ...request,
          band: bandData || null,
          requester: requesterData || null
        };
      })
    );

    return { data: requestsWithDetails, error: null };
  },

  // Get pending requests for bands the user leads
  async getBandRequests(): Promise<{ data: BandRequest[]; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: 'Not authenticated' };

    // First get the bands the user leads
    const { data: userBands, error: bandsError } = await supabase
      .from('band_members')
      .select('band_id')
      .eq('user_id', user.id)
      .eq('role', 'leader');

    if (bandsError || !userBands || userBands.length === 0) {
      return { data: [], error: bandsError };
    }

    const bandIds = userBands.map(band => band.band_id);

    // Get requests for those bands
    const { data, error } = await supabase
      .from('band_requests')
      .select('*')
      .eq('status', 'pending')
      .in('band_id', bandIds)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return { data: [], error };
    }

    // Fetch band and requester data separately
    const requestsWithDetails = await Promise.all(
      data.map(async (request) => {
        // Get band details
        const { data: bandData } = await supabase
          .from('bands')
          .select('*')
          .eq('id', request.band_id)
          .single();

        // Get requester profile
        const { data: requesterData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .eq('user_id', request.requester_id)
          .single();

        return {
          ...request,
          band: bandData || null,
          requester: requesterData || null
        };
      })
    );

    return { data: requestsWithDetails, error: null };
  },

  // Accept a band request
  async acceptRequest(requestId: string): Promise<{ data: any; error: any }> {
    const { data: request } = await supabase
      .from('band_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (!request) return { data: null, error: 'Request not found' };

    // Update request status
    const { error: updateError } = await supabase
      .from('band_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) return { data: null, error: updateError };

    // Add member to band
    const { error: memberError } = await supabase
      .from('band_members')
      .insert({
        band_id: request.band_id,
        user_id: request.requester_id,
        role: 'member'
      });

    return { data: null, error: memberError };
  },

  // Reject a band request
  async rejectRequest(requestId: string): Promise<{ data: any; error: any }> {
    const { error } = await supabase
      .from('band_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    return { data: null, error };
  },

  // Leave a band
  async leaveBand(bandId: string): Promise<{ data: any; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { error } = await supabase
      .from('band_members')
      .delete()
      .eq('band_id', bandId)
      .eq('user_id', user.id);

    return { data: null, error };
  },

  // Remove a member from a band (band leaders only)
  async removeMember(bandId: string, userId: string): Promise<{ data: any; error: any }> {
    const { error } = await supabase
      .from('band_members')
      .delete()
      .eq('band_id', bandId)
      .eq('user_id', userId);

    return { data: null, error };
  },

  // Transfer leadership to another member (current leader only)
  async transferLeadership(bandId: string, newLeaderUserId: string): Promise<{ data: any; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    // Check if current user is the leader
    const { data: currentMembership, error: membershipError } = await supabase
      .from('band_members')
      .select('role')
      .eq('band_id', bandId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !currentMembership || currentMembership.role !== 'leader') {
      return { data: null, error: 'Only the current leader can transfer leadership' };
    }

    // Verify the new leader is a member of the band
    const { data: newLeaderMembership, error: newLeaderError } = await supabase
      .from('band_members')
      .select('*')
      .eq('band_id', bandId)
      .eq('user_id', newLeaderUserId)
      .single();

    if (newLeaderError || !newLeaderMembership) {
      return { data: null, error: 'Selected user is not a member of this band' };
    }

    // Update both members atomically - first make the new person leader
    const { error: updateNewLeaderError } = await supabase
      .from('band_members')
      .update({ role: 'leader' })
      .eq('band_id', bandId)
      .eq('user_id', newLeaderUserId);

    if (updateNewLeaderError) {
      return { data: null, error: updateNewLeaderError };
    }

    // Then make the current user a member
    const { error: updateCurrentUserError } = await supabase
      .from('band_members')
      .update({ role: 'member' })
      .eq('band_id', bandId)
      .eq('user_id', user.id);

    return { data: null, error: updateCurrentUserError };
  },

  // Fix a band by adding the creator as leader (utility function)
  async fixBandCreator(bandId: string): Promise<{ data: any; error: any }> {
    // Get the band to find the creator
    const { data: band, error: bandError } = await supabase
      .from('bands')
      .select('created_by')
      .eq('id', bandId)
      .single();

    if (bandError || !band) {
      return { data: null, error: bandError || 'Band not found' };
    }

    // Check if creator is already a member
    const { data: existingMember } = await supabase
      .from('band_members')
      .select('id')
      .eq('band_id', bandId)
      .eq('user_id', band.created_by)
      .single();

    if (existingMember) {
      return { data: null, error: 'Creator is already a member' };
    }

    // Add the creator as leader
    const { error: memberError } = await supabase
      .from('band_members')
      .insert({
        band_id: bandId,
        user_id: band.created_by,
        role: 'leader'
      });

    return { data: null, error: memberError };
  },

  // Disband a band (band leaders only)
  async disbandBand(bandId: string): Promise<{ data: any; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    // Check if user is a leader of this band
    const { data: membership, error: membershipError } = await supabase
      .from('band_members')
      .select('role')
      .eq('band_id', bandId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership || membership.role !== 'leader') {
      return { data: null, error: 'Only band leaders can disband bands' };
    }

    // Delete all band members first
    const { error: membersError } = await supabase
      .from('band_members')
      .delete()
      .eq('band_id', bandId);

    if (membersError) {
      return { data: null, error: membersError };
    }

    // Delete all pending requests for this band
    const { error: requestsError } = await supabase
      .from('band_requests')
      .delete()
      .eq('band_id', bandId);

    if (requestsError) {
      console.error('Error deleting band requests:', requestsError);
    }

    // Finally, delete the band
    const { error: bandError } = await supabase
      .from('bands')
      .delete()
      .eq('id', bandId);

    return { data: null, error: bandError };
  }
};
