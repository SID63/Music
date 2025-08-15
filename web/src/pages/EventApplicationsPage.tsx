// EventApplicationsPage component for managing job applications
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobService, type JobApplication } from '../services/jobService';
import { supabase } from '../lib/supabaseClient';
import MessageButton from '../components/MessageButton';

type ApplicationWithMusician = JobApplication & {
  musician: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    genres: string[] | null;
  };
};

export default function EventApplicationsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [applications, setApplications] = useState<ApplicationWithMusician[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      loadEventAndApplications();
    }
  }, [eventId]);

  const loadEventAndApplications = async () => {
    if (!eventId || !profile) return;

    try {
      // Load event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('organizer_profile_id', profile.id)
        .single();

      if (eventError || !eventData) {
        alert('Event not found or you do not have permission to view applications');
        navigate('/events');
        return;
      }

      setEvent(eventData);

      // Load applications
      const { data: applicationsData, error: applicationsError } = await jobService.getEventApplications(eventId);
      
      if (applicationsError) {
        console.error('Error loading applications:', applicationsError);
        return;
      }

      // Load musician profiles for applications
      if (applicationsData && applicationsData.length > 0) {
        const musicianIds = [...new Set(applicationsData.map(app => app.musician_profile_id))];
        const { data: musicianProfiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, bio, genres')
          .in('id', musicianIds);

        const applicationsWithMusicians = applicationsData.map(app => ({
          ...app,
          musician: musicianProfiles?.find(p => p.id === app.musician_profile_id) || {
            id: app.musician_profile_id,
            display_name: null,
            avatar_url: null,
            bio: null,
            genres: null
          }
        }));

        setApplications(applicationsWithMusicians);
      }
    } catch (error) {
      console.error('Error loading event and applications:', error);
      alert('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (applicationId: string, status: 'accepted' | 'rejected' | 'completed') => {
    setUpdatingStatus(applicationId);
    try {
      const { error } = await jobService.updateApplicationStatus(applicationId, status);
      
      if (error) {
        alert('Failed to update application status: ' + error);
      } else {
        // Update local state
        setApplications(prev => prev.map(app => 
          app.id === applicationId ? { ...app, status } : app
        ));
        alert(`Application ${status} successfully`);
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('An error occurred while updating the application');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          <p className="text-gray-600">The event you're looking for doesn't exist or you don't have permission to view it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Link
              to="/events"
              className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
            >
              ← Back to Events
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
            <p className="text-gray-600 mt-2">{event.title}</p>
          </div>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-600">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Applications Yet</h3>
          <p className="text-gray-500">Musicians haven't applied for this event yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((application) => (
            <div key={application.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <img
                    src={application.musician.avatar_url || `data:image/svg+xml;base64,${btoa(`
                      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="48" height="48" fill="#6B7280"/>
                        <text x="24" y="30" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="18" font-weight="bold">M</text>
                      </svg>
                    `)}`}
                    alt="Musician Avatar"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {application.musician.display_name || 'Unknown Musician'}
                    </h3>
                                         <div className="flex items-center space-x-2 mt-1">
                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(application.status)}`}>
                         {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                       </span>
                       <span className="text-sm text-gray-500">
                         Applied {new Date(application.created_at).toLocaleDateString()}
                       </span>
                       {application.quotation && (
                         <span className="text-sm font-medium text-green-600">
                           💰 ${application.quotation}
                         </span>
                       )}
                     </div>
                  </div>
                </div>
              </div>

              {/* Musician Details */}
              <div className="mb-4 space-y-2">
                {application.musician.bio && (
                  <p className="text-gray-700 text-sm">{application.musician.bio}</p>
                )}
                
                {application.musician.genres && application.musician.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {application.musician.genres.map((genre, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex space-x-3">
                  <Link
                    to={`/musicians/${application.musician.id}`}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    View Profile
                  </Link>
                  
                  <MessageButton
                    recipientProfileId={application.musician.id}
                    recipientName={application.musician.display_name || 'Musician'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  />
                </div>

                {/* Status Update Buttons */}
                {application.status === 'pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateStatus(application.id, 'rejected')}
                      disabled={updatingStatus === application.id}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {updatingStatus === application.id ? 'Updating...' : 'Reject'}
                    </button>
                    
                    <button
                      onClick={() => handleUpdateStatus(application.id, 'accepted')}
                      disabled={updatingStatus === application.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {updatingStatus === application.id ? 'Updating...' : 'Accept'}
                    </button>
                  </div>
                )}

                {application.status === 'accepted' && (
                  <button
                    onClick={() => handleUpdateStatus(application.id, 'completed')}
                    disabled={updatingStatus === application.id}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {updatingStatus === application.id ? 'Updating...' : 'Mark Complete'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
