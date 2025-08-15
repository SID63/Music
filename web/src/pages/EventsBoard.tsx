import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import MessageButton from '../components/MessageButton';
import EventApplicationsManager from '../components/EventApplicationsManager';
import MyApplicationsManager from '../components/MyApplicationsManager';
import EventApplicationForm from '../components/EventApplicationForm';

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
};

export default function EventsBoard() {
  const { profile, user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    const load = async () => {
      // Load all events with enhanced fields and organizer info
      const { data } = await supabase
        .from('events')
        .select(`
          id, title, description, location, event_type, genres, 
          starts_at, ends_at, budget_min, budget_max, 
          contact_email, contact_phone, requirements, 
          equipment_provided, parking_info, additional_notes, created_at,
          organizer_profile_id, band_id, posted_by_type
        `)
        .order('starts_at', { ascending: true });
      
      const eventsData = (data as unknown as Event[]) || [];
      setEvents(eventsData);

      // Load organizer profiles for events
      if (eventsData.length > 0) {
        const organizerIds = [...new Set(eventsData.map(e => e.organizer_profile_id))];
        const { data: organizerProfiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', organizerIds);

        // Load band data for events posted by bands
        const bandIds = [...new Set(eventsData.filter(e => e.band_id).map(e => e.band_id!))];
        let bandsData: any[] = [];
        
        if (bandIds.length > 0) {
          const { data: bands } = await supabase
            .from('bands')
            .select('id, name, description')
            .in('id', bandIds);
          bandsData = bands || [];
        }

        const eventsWithOrganizers = eventsData.map(event => ({
          ...event,
          organizer: organizerProfiles?.find(p => p.id === event.organizer_profile_id),
          band: bandsData.find(b => b.id === event.band_id)
        }));
        setEvents(eventsWithOrganizers);
      }

             // Load user's events if they're an organizer or musician
       if (user && (profile?.role === 'organizer' || profile?.role === 'musician')) {
        const { data: myEventsData } = await supabase
          .from('events')
          .select(`
            id, title, description, location, event_type, genres, 
            starts_at, ends_at, budget_min, budget_max, 
            contact_email, contact_phone, requirements, 
            equipment_provided, parking_info, additional_notes, created_at
          `)
          .eq('organizer_profile_id', profile.id)
        .order('starts_at', { ascending: true });
        setMyEvents((myEventsData as unknown as Event[]) || []);
      }

      
    };
    load();
  }, [user, profile]);

  // Get all unique event types and genres for filtering
  const allEventTypes = Array.from(new Set(events.map(e => e.event_type).filter(Boolean)));
  const allGenres = Array.from(new Set(events.flatMap(e => e.genres || [])));

  // Filter events based on selected filters
  const filteredEvents = events.filter(event => {
    const matchesEventType = selectedEventType === 'all' || event.event_type === selectedEventType;
    const matchesGenre = selectedGenre === 'all' || (event.genres && event.genres.includes(selectedGenre));
    return matchesEventType && matchesGenre;
  });

  const formatEventType = (type: string | null) => {
    if (!type) return 'Gig';
    const typeMap: { [key: string]: string } = {
      'gig': 'Gig/Performance',
      'wedding': 'Wedding',
      'corporate': 'Corporate Event',
      'festival': 'Festival',
      'party': 'Private Party',
      'ceremony': 'Ceremony',
      'other': 'Other'
    };
    return typeMap[type] || type;
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Budget not specified';
    if (min && max) return `$${min} - $${max}`;
    if (min) return `From $${min}`;
    if (max) return `Up to $${max}`;
    return 'Budget not specified';
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };



  const EventCard = ({ event, isMyEvent = false }: { event: Event; isMyEvent?: boolean }) => {
    const [hasConfirmedBookings, setHasConfirmedBookings] = useState(false);
    const [checkingBookings, setCheckingBookings] = useState(false);

    // Check for confirmed bookings when component mounts
    useEffect(() => {
      if (isMyEvent) {
        checkConfirmedBookings();
      }
    }, [event.id, isMyEvent]);

    const checkConfirmedBookings = async () => {
      setCheckingBookings(true);
      try {
        const { data: confirmedBookings, error } = await supabase
          .from('bookings')
          .select('id, status')
          .eq('event_id', event.id)
          .in('status', ['confirmed', 'completed']);

        if (!error && confirmedBookings) {
          setHasConfirmedBookings(confirmedBookings.length > 0);
        }
      } catch (error) {
        console.error('Error checking confirmed bookings:', error);
      } finally {
        setCheckingBookings(false);
      }
    };

    return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow ${
      isMyEvent ? 'border-blue-200' : 'border-gray-200'
    }`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-xl text-gray-900 mb-2">{event.title}</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                event.event_type === 'wedding' ? 'bg-pink-100 text-pink-800' :
                event.event_type === 'corporate' ? 'bg-blue-100 text-blue-800' :
                event.event_type === 'festival' ? 'bg-purple-100 text-purple-800' :
                event.event_type === 'party' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {formatEventType(event.event_type)}
              </span>
              {event.posted_by_type === 'band' && event.band && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                  Posted by {event.band.name}
                </span>
              )}
              {isMyEvent && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  My Event
                </span>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm bg-green-50 text-green-700 px-3 py-2 rounded-lg font-medium">
              {formatBudget(event.budget_min, event.budget_max)}
            </div>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-gray-700 leading-relaxed line-clamp-3">{event.description}</p>
        )}

        {/* Genres */}
        {event.genres && event.genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.genres.map((genre, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Location and Timing */}
        <div className="space-y-2">
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>📍</span>
              <span>{event.location}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>📅</span>
            <span>{formatDateTime(event.starts_at).date}</span>
            <span>at</span>
            <span className="font-medium">{formatDateTime(event.starts_at).time}</span>
          </div>
          
          {event.ends_at && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>⏰</span>
              <span>Ends: {formatDateTime(event.ends_at).time}</span>
            </div>
          )}
        </div>

        {/* Additional Details */}
        {(event.requirements || event.equipment_provided || event.parking_info) && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            {event.requirements && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Requirements:</span>
                <span className="text-gray-600 ml-2">{event.requirements}</span>
              </div>
            )}
            
            {event.equipment_provided && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Equipment:</span>
                <span className="text-gray-600 ml-2">{event.equipment_provided}</span>
              </div>
            )}
            
            {event.parking_info && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Parking:</span>
                <span className="text-gray-600 ml-2">{event.parking_info}</span>
              </div>
            )}
          </div>
        )}

        {/* Contact Information */}
        {(event.contact_email || event.contact_phone) && (
          <div className="pt-2 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-700">Contact:</span>
              {event.contact_email && (
                <span className="ml-2">{event.contact_email}</span>
              )}
              {event.contact_phone && (
                <span className="ml-2">{event.contact_phone}</span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3 pt-4 border-t border-gray-100">
          {isMyEvent ? (
            hasConfirmedBookings ? (
              <div className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg text-center font-medium cursor-not-allowed">
                Cannot Edit - Artists Confirmed
              </div>
            ) : (
              <Link
                to={`/events/edit/${event.id}`}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
              >
                Edit Event
              </Link>
            )
          ) : (
                         <div className="flex-1 space-y-2">
               {/* Contact Organizer Button */}
               {event.organizer && (
                 <MessageButton
                   recipientProfileId={event.organizer.id}
                   recipientName={event.organizer.display_name || 'Organizer'}
                   className="w-full"
                   eventContext={{
                     eventId: event.id,
                     eventTitle: event.title,
                     eventDate: formatDateTime(event.starts_at).date,
                     eventLocation: event.location || undefined
                   }}
                 />
               )}
               
               {/* Apply for Event Button */}
               {profile?.role === 'musician' && !isMyEvent && (
                 <button
                   onClick={() => {
                     setSelectedEvent(event);
                     setShowApplicationForm(true);
                   }}
                   className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                 >
                   Apply for Event
                 </button>
               )}
               

             </div>
          )}
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="container space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-gray-600">Browse upcoming gigs and opportunities</p>
        </div>
                 {(profile?.role === 'organizer' || profile?.role === 'musician') && (
          <div className="flex gap-2">
            <Link 
              to="/events/post" 
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Post Event
            </Link>
            <Link 
              to="/events/post" 
              className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Post as Band
            </Link>
          </div>
        )}
      </div>
      
      {/* Filters */}
      {(allEventTypes.length > 0 || allGenres.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Events</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Event Types</option>
                {allEventTypes.map(type => (
                  <option key={type} value={type}>{formatEventType(type)}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Genres</option>
                {allGenres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
          </div>
            </div>
          )}

             {/* My Events Section */}
       {user && (profile?.role === 'organizer' || profile?.role === 'musician') && myEvents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight mb-6">My Events</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {myEvents.map((event) => (
              <EventCard key={event.id} event={event} isMyEvent={true} />
            ))}
        </div>
                    </div>
                  )}

      {/* Event Applications Management Section */}
      {user && (profile?.role === 'organizer' || profile?.role === 'musician') && myEvents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Event Applications</h2>
          <EventApplicationsManager events={myEvents} userRole={profile?.role} />
        </div>
      )}

      {/* My Applications Section for Musicians */}
      {user && profile?.role === 'musician' && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight mb-6">My Applications</h2>
          <MyApplicationsManager />
        </div>
      )}
      
      {/* Debug info for organizers and musicians with events */}
      {user && (profile?.role === 'organizer' || profile?.role === 'musician') && myEvents.length > 0 && (
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Debug Info for Event Posters</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <div>User ID: {user.id}</div>
            <div>Profile Role: {profile.role}</div>
            <div>My Events Count: {myEvents.length}</div>
            <div>Profile ID: {profile.id}</div>
            <div>Can View Applications: ✅ Yes</div>
                </div>
              </div>
      )}

      {/* All Events Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight mb-6">
          All Events {filteredEvents.length > 0 && `(${filteredEvents.length})`}
        </h2>
      </div>
      
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-600">
          <div className="text-6xl mb-4">🎵</div>
          <div className="text-xl font-medium mb-2">No events found</div>
          <div className="text-gray-500 mb-4">
            {events.length === 0 ? 'No events have been posted yet.' : 'Try adjusting your filters.'}
          </div>
                     {(profile?.role === 'organizer' || profile?.role === 'musician') && (
             <Link to="/events/post" className="text-blue-600 hover:underline font-medium">
               Be the first to post an event!
             </Link>
           )}
            </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Application Form Modal */}
      {showApplicationForm && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <EventApplicationForm
              event={selectedEvent}
              onSuccess={() => {
                setShowApplicationForm(false);
                setSelectedEvent(null);
                // Optionally refresh the page or show success message
                window.location.reload();
              }}
              onCancel={() => {
                setShowApplicationForm(false);
                setSelectedEvent(null);
              }}
            />
          </div>
        </div>
      )}
      
    </div>
  );
}




