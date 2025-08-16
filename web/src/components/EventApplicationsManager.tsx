import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import MessageButton from './MessageButton';

interface Event {
  id: string;
  title: string;
  starts_at: string;
  location?: string;
}

interface Application {
  id: string;
  event_id: string;
  musician_profile_id: string;
  quotation: number;
  additional_requirements?: string;
  created_at: string;
  updated_at?: string; // Make optional since it might not exist yet
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

interface EventApplicationsManagerProps {
  events: Event[];
  userRole?: string;
}

const EventApplicationsManager: React.FC<EventApplicationsManagerProps> = ({ events, userRole }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'quote' | 'rating'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterByRating, setFilterByRating] = useState<number>(0);

  useEffect(() => {
    loadApplications();
  }, [selectedEvent, events]);

  // Refresh applications when component comes into focus
  useEffect(() => {
    const handleFocus = () => {
      loadApplications();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadApplications = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      

      
             let basicQuery = supabase
         .from('bookings')
         .select('id, event_id, musician_profile_id, quotation, additional_requirements, created_at, status, band_id, applied_by_type');
      
      // Filter by event(s)
      if (selectedEvent === 'all') {
        if (events.length > 0) {
          basicQuery = basicQuery.in('event_id', events.map(e => e.id));
        }
      } else {
        basicQuery = basicQuery.eq('event_id', selectedEvent);
      }
      
      const { data: basicBookings, error: basicError } = await basicQuery;
      

      
      if (basicError) {
        console.error('Basic bookings query failed:', basicError);
        // Don't throw error yet, let's see what we can get
      }
      
      // If basic query works, try to get profile and event data separately
      if (basicBookings && basicBookings.length > 0) {
                 // Get musician profiles - try a simpler query first
         const musicianIds = [...new Set(basicBookings.map(b => b.musician_profile_id))];
         
         // Try a basic profiles query first - use individual queries to avoid complex IN clause issues
         const profilePromises = musicianIds.map(id => 
           supabase
             .from('profiles')
             .select('id, display_name')
             .eq('id', id)
             .single()
         );
         
         const profileResults = await Promise.all(profilePromises);
                    const basicProfiles = profileResults
             .filter(result => !result.error && result.data)
             .map(result => result.data!)
             .filter(Boolean);
         const basicProfilesError = profileResults.some(result => result.error) ? 
           new Error('Some profile queries failed') : null;
         
                    // If basic query works, try the full query with error handling
           let profiles = null;
           let profilesError = null;
           
           if (!basicProfilesError) {
             // Try to get additional profile data, but handle missing columns gracefully
             try {
               const fullProfilePromises = musicianIds.map(id => 
                 supabase
                   .from('profiles')
                   .select('id, display_name')
                   .eq('id', id)
                   .single()
               );
               
               const fullProfileResults = await Promise.all(fullProfilePromises);
               const fullProfiles = fullProfileResults
                 .filter(result => !result.error && result.data)
                 .map(result => result.data!)
                 .filter(Boolean);
               
               if (fullProfiles.length > 0) {
                 profiles = fullProfiles;
                 profilesError = null;
               } else {
                 profiles = basicProfiles;
                 profilesError = null;
               }
             } catch (error) {
               console.log('Error in full profiles query, using basic profiles:', error);
               profiles = basicProfiles;
               profilesError = null;
             }
           } else {
             profiles = basicProfiles;
             profilesError = basicProfilesError;
           }
         

        
        // Get events - use individual queries to avoid complex IN clause issues
        const eventIds = [...new Set(basicBookings.map(b => b.event_id))];
        const eventPromises = eventIds.map(id => 
          supabase
            .from('events')
            .select('id, title, starts_at, location')
            .eq('id', id)
            .single()
        );
        
        const eventResults = await Promise.all(eventPromises);
        const eventsData = eventResults
          .filter(result => !result.error && result.data)
          .map(result => result.data!)
          .filter(Boolean);
        const eventsError = eventResults.some(result => result.error) ? 
          new Error('Some event queries failed') : null;
        
        
        
                          // Get band data for band applications
         const bandIds = [...new Set(basicBookings.filter(b => b.band_id).map(b => b.band_id!))];
         let bandsData: any[] = [];
         
         if (bandIds.length > 0) {
           const bandPromises = bandIds.map(id => 
             supabase
               .from('bands')
               .select('id, name, description')
               .eq('id', id)
               .single()
           );
           
           const bandResults = await Promise.all(bandPromises);
           bandsData = bandResults
             .filter(result => !result.error && result.data)
             .map(result => result.data!)
             .filter(Boolean);
         }
         
         // Combine the data manually
         const processedData = basicBookings.map(booking => {
           const profile = profiles?.find(p => p.id === booking.musician_profile_id);
           const event = eventsData?.find(e => e.id === booking.event_id);
           const band = bandsData?.find(b => b.id === booking.band_id);
           
           return {
             ...booking,
             updated_at: (booking as any).updated_at || booking.created_at, // Use created_at as fallback
             musician_profile: profile || { 
               id: booking.musician_profile_id, 
               display_name: 'Unknown Musician'
             },
             band: band || undefined,
             event: event || { 
               id: booking.event_id, 
               title: 'Unknown Event', 
               starts_at: 'Unknown Date', 
               location: 'Unknown Location' 
             }
           };
         });
        

         setApplications(processedData);
      } else {

        setApplications([]);
      }
      
      
      
                    // Note: Test insert removed to avoid database errors during development
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSortedAndFilteredApplications = () => {
    let filtered = applications.filter(app => 
      filterByRating === 0 || (app.musician_profile.rating || 0) >= filterByRating
    );

    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
          break;
        case 'quote':
          comparison = (a.quotation || 0) - (b.quotation || 0);
          break;
        case 'rating':
          comparison = (a.musician_profile.rating || 0) - (b.musician_profile.rating || 0);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderRating = (rating?: number) => {
    if (!rating) return <span className="text-gray-400">No rating</span>;
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
            ★
          </span>
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

     const getStatusBadge = (status?: string, application?: Application) => {
     if (!status || status === 'pending') {
       const isUpdated = application?.updated_at && 
         new Date(application.updated_at) > new Date(application.created_at);
       return (
         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
           isUpdated ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
         }`}>
           {isUpdated ? 'Updated' : 'Pending'}
         </span>
       );
     } else if (status === 'confirmed') {
       return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Accepted by Organizer</span>;
     } else if (status === 'completed') {
       return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Confirmed by Musician</span>;
     } else if (status === 'declined') {
       return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Declined</span>;
     } else if (status === 'cancelled') {
       return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Cancelled</span>;
     }
     return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Unknown</span>;
   };

   const sortedApplications = getSortedAndFilteredApplications();

   // Handler functions for action buttons
   const handleAcceptApplication = async (application: Application) => {
 
     
     if (!confirm(`Are you sure you want to accept ${application.musician_profile.display_name}'s application for $${application.quotation}?`)) {
       return;
     }
     
     try {
             const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', application.id);
       
       if (error) {
         console.error('Error accepting application:', error);
         alert('Failed to accept application. Please try again.');
         return;
       }
       
       // Update local state
       setApplications(prev => prev.map(app => 
         app.id === application.id 
           ? { ...app, status: 'confirmed' }
           : app
       ));
       
       alert(`Application confirmed! ${application.musician_profile.display_name} will be notified.`);
     } catch (error) {
       console.error('Error accepting application:', error);
       alert('Failed to accept application. Please try again.');
     }
   };

   const handleDeclineApplication = async (application: Application) => {
 
     
     if (!confirm(`Are you sure you want to decline ${application.musician_profile.display_name}'s application?`)) {
       return;
     }
     
     try {
       const { error } = await supabase
         .from('bookings')
         .update({ status: 'declined' })
         .eq('id', application.id);
       
       if (error) {
         console.error('Error declining application:', error);
         alert('Failed to decline application. Please try again.');
         return;
       }
       
       // Update local state
       setApplications(prev => prev.map(app => 
         app.id === application.id 
           ? { ...app, status: 'declined' }
           : app
       ));
       
       alert(`Application declined. ${application.musician_profile.display_name} will be notified.`);
     } catch (error) {
       console.error('Error declining application:', error);
       alert('Failed to decline application. Please try again.');
     }
   };

   const handleViewProfile = (application: Application) => {
 
     // Navigate to musician profile page using the correct route
     navigate(`/musicians/${application.musician_profile.id}`);
   };

  return (
    <div className="bg-card ui-glass ui-vibrant-border rounded-xl shadow-sm border border-border p-6">
      {/* Header with role-specific information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {userRole === 'musician' ? 'Applications for Your Events' : 'Event Applications Management'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {userRole === 'musician' 
            ? 'Review quotes and applications from other musicians for your events'
            : 'Manage and review all applications for your events'
          }
        </p>
        
        {/* Additional info for musicians */}
        {userRole === 'musician' && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">💡 How it works:</div>
              <ul className="space-y-1 text-xs">
                <li>• Other musicians can submit quotes for your events</li>
                <li>• Review their experience, ratings, and requirements</li>
                <li>• Contact them directly to discuss collaboration</li>
                <li>• Consider their quotes for your event needs</li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Filters and Sorting */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Event</label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
          >
            <option value="all">All Events</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>{event.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'quote' | 'rating')}
            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
          >
            <option value="date">Date</option>
            <option value="quote">Quote Amount</option>
            <option value="rating">Rating</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Order</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
          >
            <option value="desc">Newest/High to Low</option>
            <option value="asc">Oldest/Low to High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Min Rating</label>
          <select
            value={filterByRating}
            onChange={(e) => setFilterByRating(Number(e.target.value))}
            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
          >
            <option value={0}>Any Rating</option>
            <option value={1}>1+ Stars</option>
            <option value={2}>2+ Stars</option>
            <option value={3}>3+ Stars</option>
            <option value={4}>4+ Stars</option>
            <option value={5}>5 Stars</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading applications...</p>
        </div>
             ) : sortedApplications.length === 0 ? (
         <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-2">📝</div>
          <p>No applications found for the selected criteria.</p>
          {userRole === 'musician' && (
            <p className="text-sm text-muted-foreground mt-2">
              When other musicians apply to your events, you'll see their quotes and requirements here.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedApplications.map((application) => (
            <div key={application.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors bg-card/50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-lg text-foreground">
                     {application.applied_by_type === 'band' && application.band ? (
                       <div>
                         <div>{application.band.name}</div>
                         <div className="text-sm text-muted-foreground font-normal">
                           Applied by {application.musician_profile.display_name}
                         </div>
                       </div>
                     ) : (
                       application.musician_profile.display_name
                     )}
                   </h4>
                   {renderRating(application.musician_profile.rating)}
                   {getStatusBadge(application.status, application)}
                   {application.applied_by_type === 'band' && (
                     <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                       Band Application
                     </span>
                   )}
                 </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium">Event:</span> {application.event.title}
                    {application.event.location && (
                      <span className="ml-2">📍 {application.event.location}</span>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Date:</span> {formatDate(application.event.starts_at)}
                  </div>
                </div>
                
                                 <div className="text-right">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {formatCurrency(application.quotation || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Updated: {formatDate(application.updated_at || application.created_at)}
                  </div>
                   {application.status === 'pending' && application.updated_at && 
                    new Date(application.updated_at) > new Date(application.created_at) && (
                     <div className="text-xs text-blue-600 font-medium mt-1">
                       ✨ New quotation submitted
                     </div>
                   )}
                 </div>
              </div>

              {/* Additional Requirements */}
              {application.additional_requirements && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Additional Requirements:</div>
                  <p className="text-sm text-muted-foreground">{application.additional_requirements}</p>
                </div>
              )}

              {/* Musician Details */}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Bio:</div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      No bio provided
                    </p>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Genres:</div>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-sm text-muted-foreground">No genres specified</span>
                    </div>
                  </div>
                </div>
              </div>

                                            {/* Actions */}
                <div className="mt-4 pt-3 border-t border-border flex gap-2">
                  <MessageButton 
                    recipientProfileId={application.musician_profile.id}
                    recipientName={application.musician_profile.display_name}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  />
                  
                  {/* Conditional action buttons based on status */}
                  {(!application.status || application.status === 'pending') && (
                    <>
                      <button 
                        onClick={() => handleAcceptApplication(application)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Accept Application
                      </button>
                      <button 
                        onClick={() => handleDeclineApplication(application)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Decline Application
                      </button>
                    </>
                  )}
                  
                  {application.status === 'confirmed' && (
                    <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                      Accepted by Organizer - Waiting for Musician Confirmation
                    </span>
                  )}
                  
                  {application.status === 'completed' && (
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                      Confirmed ✅ - Musician has confirmed
                    </span>
                  )}
                  
                  {application.status === 'declined' && (
                    <span className="px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium">
                      Declined
                    </span>
                  )}
                  
                  <button 
                    onClick={() => handleViewProfile(application)}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm font-medium"
                  >
                    View Profile
                  </button>
                </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {sortedApplications.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{sortedApplications.length}</div>
              <div className="text-sm text-muted-foreground">Total Applications</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(sortedApplications.reduce((sum, app) => sum + (app.quotation || 0), 0) / sortedApplications.length)}
              </div>
              <div className="text-sm text-muted-foreground">Average Quote</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                0
              </div>
              <div className="text-sm text-muted-foreground">High-Rated Musicians</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventApplicationsManager;
