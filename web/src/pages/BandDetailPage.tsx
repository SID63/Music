import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bandService } from '../services/bandService';
import type { Band, BandMember, BandRequest } from '../types/band';

export default function BandDetailPage() {
  const { bandId } = useParams<{ bandId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [band, setBand] = useState<Band | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<BandRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to parse band details from description
  const parseBandDetails = (description: string) => {
    const details: any = {};
    
    if (description.includes('--- Band Details ---')) {
      const parts = description.split('--- Band Details ---');
      const mainDescription = parts[0].trim();
      const detailsSection = parts[1]?.trim();
      
      details.mainDescription = mainDescription;
      
      if (detailsSection) {
        const lines = detailsSection.split('\n');
        lines.forEach(line => {
          if (line.includes(':')) {
            const [key, value] = line.split(':').map(s => s.trim());
            if (key && value) {
              details[key.toLowerCase().replace(/\s+/g, '_')] = value;
            }
          }
        });
      }
    } else {
      details.mainDescription = description;
    }
    
    return details;
  };

  useEffect(() => {
    if (bandId) {
      loadBand();
    }
  }, [bandId]);

  useEffect(() => {
    if (bandId && isLeader) {
      loadPendingRequests();
    }
  }, [bandId, isLeader]);

  const loadBand = async () => {
    if (!bandId) {
      console.error('No band ID provided');
      navigate('/bands');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading band with ID:', bandId);
      const { data, error } = await bandService.getBand(bandId);
      
      if (error || !data) {
        console.error('Error loading band:', error);
        setError(error?.message || 'Failed to load band details');
        navigate('/bands');
        return;
      }
      
      console.log('Band data loaded:', data);
      setBand(data);
      
      // Check if current user is a member or leader
      if (user && data.members) {
        const userMember = data.members.find(member => member.user_id === user.id);
        const isUserMember = !!userMember;
        const isUserLeader = userMember?.role === 'leader';
        
        console.log('User membership status:', { isUserMember, isUserLeader });
        setIsMember(isUserMember);
        setIsLeader(isUserLeader);
      }
    } catch (err) {
      console.error('Unexpected error in loadBand:', err);
      setError('An unexpected error occurred while loading the band');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async () => {
    if (!bandId) return;
    
    const message = prompt('Add a message to your request (optional):');
    const { error } = await bandService.sendJoinRequest(bandId, message || undefined);
    
    if (!error) {
      alert('Join request sent successfully!');
    } else {
      alert('Failed to send request: ' + error.message);
    }
  };

  const handleLeaveBand = async () => {
    if (!bandId || !confirm('Are you sure you want to leave this band?')) return;
    
    const { error } = await bandService.leaveBand(bandId);
    
    if (!error) {
      alert('You have left the band');
      navigate('/bands');
    } else {
      alert('Failed to leave band: ' + error.message);
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!bandId || !confirm(`Are you sure you want to remove ${memberName} from the band?`)) return;
    
    const { error } = await bandService.removeMember(bandId, userId);
    
    if (!error) {
      alert('Member removed successfully');
      loadBand();
    } else {
      alert('Failed to remove member: ' + error.message);
    }
  };

  const loadPendingRequests = async () => {
    if (!bandId) return;
    
    setLoadingRequests(true);
    const { data, error } = await bandService.getBandRequests();
    
    if (!error && data) {
      // Filter requests for this specific band
      const bandRequests = data.filter(request => request.band_id === bandId);
      setPendingRequests(bandRequests);
    } else {
      console.error('Error loading pending requests:', error);
    }
    
    setLoadingRequests(false);
  };

  const handleAcceptRequest = async (requestId: string, requesterName: string) => {
    if (!confirm(`Accept ${requesterName}'s request to join the band?`)) return;
    
    const { error } = await bandService.acceptRequest(requestId);
    
    if (!error) {
      alert('Request accepted successfully');
      loadBand(); // Reload band to show new member
      loadPendingRequests(); // Reload requests
    } else {
      alert('Failed to accept request: ' + error.message);
    }
  };

  const handleRejectRequest = async (requestId: string, requesterName: string) => {
    if (!confirm(`Reject ${requesterName}'s request to join the band?`)) return;
    
    const { error } = await bandService.rejectRequest(requestId);
    
    if (!error) {
      alert('Request rejected successfully');
      loadPendingRequests(); // Reload requests
    } else {
      alert('Failed to reject request: ' + error.message);
    }
  };

  const handleDisbandBand = async () => {
    if (!bandId || !confirm('Are you sure you want to disband this band? This action cannot be undone and will remove all members and pending requests.')) return;
    
    const { error } = await bandService.disbandBand(bandId);
    
    if (!error) {
      alert('Band disbanded successfully');
      navigate('/bands');
    } else {
      alert('Failed to disband band: ' + error.message);
    }
  };

  const handleTransferLeadership = async (newLeaderUserId: string, newLeaderName: string) => {
    if (!bandId || !confirm(`Are you sure you want to transfer leadership to ${newLeaderName}? You will become a regular member.`)) return;
    
    const { error } = await bandService.transferLeadership(bandId, newLeaderUserId);
    
    if (!error) {
      alert(`Leadership transferred to ${newLeaderName} successfully!`);
      loadBand(); // Reload to update the UI
    } else {
      alert('Failed to transfer leadership: ' + error.message);
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

  if (!band) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Band Not Found</h2>
          <Link
            to="/bands"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Bands
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            to="/bands"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
          >
            ← Back to Bands
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{band.name}</h1>
          <p className="text-gray-600 mt-2">
            Created {new Date(band.created_at).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex space-x-3">
          {!isMember && profile?.role === 'musician' && (
            <button
              onClick={handleJoinRequest}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Request to Join
            </button>
          )}
          
          {isMember && !isLeader && (
            <button
              onClick={handleLeaveBand}
              className="px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
            >
              Leave Band
            </button>
          )}

          {isLeader && (
            <button
              onClick={handleDisbandBand}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Disband Band
            </button>
          )}
        </div>
      </div>

      {/* Band Description */}
      {band.description && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
          {(() => {
            const details = parseBandDetails(band.description);
            return (
              <div className="space-y-4">
                {details.mainDescription && (
                  <p className="text-gray-700 leading-relaxed">{details.mainDescription}</p>
                )}
                
                {(details.genre || details.location || details.experience_level || details.looking_for || details.practice_schedule || details.goals) && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Band Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {details.genre && (
                        <div>
                          <span className="font-medium text-gray-700">Genre:</span>
                          <span className="ml-2 text-gray-600">{details.genre}</span>
                        </div>
                      )}
                      {details.location && (
                        <div>
                          <span className="font-medium text-gray-700">Location:</span>
                          <span className="ml-2 text-gray-600">{details.location}</span>
                        </div>
                      )}
                      {details.experience_level && (
                        <div>
                          <span className="font-medium text-gray-700">Experience Level:</span>
                          <span className="ml-2 text-gray-600 capitalize">{details.experience_level}</span>
                        </div>
                      )}
                      {details.looking_for && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-700">Looking For:</span>
                          <span className="ml-2 text-gray-600">{details.looking_for}</span>
                        </div>
                      )}
                      {details.practice_schedule && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-700">Practice Schedule:</span>
                          <span className="ml-2 text-gray-600">{details.practice_schedule}</span>
                        </div>
                      )}
                      {details.goals && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-700">Goals:</span>
                          <span className="ml-2 text-gray-600">{details.goals}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Pending Requests - Only show for band leaders */}
      {isLeader && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Pending Join Requests</h2>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              {pendingRequests.length} pending
            </span>
          </div>

          {loadingRequests ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📝</div>
              <p className="text-gray-600">No pending join requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={request.requester?.avatar_url || `data:image/svg+xml;base64,${btoa(`
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="40" height="40" fill="#6B7280"/>
                          <text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">U</text>
                        </svg>
                      `)}`}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
                          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="40" height="40" fill="#6B7280"/>
                            <text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">U</text>
                          </svg>
                        `)}`;
                      }}
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {request.requester?.display_name || 'Unknown User'}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          Requested {new Date(request.created_at).toLocaleDateString()}
                        </span>
                        {request.message && (
                          <span className="text-sm text-gray-600">
                            • "{request.message}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                                     <div className="flex space-x-2">
                     <Link
                       to={`/musicians/${request.requester_id}`}
                       className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                     >
                       View Profile
                     </Link>
                     <button
                       onClick={() => handleAcceptRequest(request.id, request.requester?.display_name || 'this user')}
                       className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                     >
                       Accept
                     </button>
                     <button
                       onClick={() => handleRejectRequest(request.id, request.requester?.display_name || 'this user')}
                       className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                     >
                       Reject
                     </button>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Members</h2>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {band.members?.length || 0} members
          </span>
        </div>

        {!band.members || band.members.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">👥</div>
            <p className="text-gray-600">No members yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {band.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={member.user?.avatar_url || `data:image/svg+xml;base64,${btoa(`
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="40" height="40" fill="#6B7280"/>
                        <text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">U</text>
                      </svg>
                    `)}`}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="40" height="40" fill="#6B7280"/>
                          <text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">U</text>
                        </svg>
                      `)}`;
                    }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.user?.display_name || 'Unknown User'}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.role === 'leader' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role === 'leader' ? 'Leader' : 'Member'}
                      </span>
                      <span className="text-sm text-gray-500">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                                 <div className="flex space-x-2">
                   <Link
                     to={`/musicians/${member.user_id}`}
                     className="px-3 py-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                   >
                     View Profile
                   </Link>
                   {isLeader && member.role !== 'leader' && (
                     <>
                       <button
                         onClick={() => handleTransferLeadership(member.user_id, member.user?.display_name || 'this member')}
                         className="px-3 py-1 text-purple-600 hover:text-purple-700 text-sm font-medium"
                         title="Transfer leadership to this member"
                       >
                         Make Leader
                       </button>
                       <button
                         onClick={() => handleRemoveMember(member.user_id, member.user?.display_name || 'this member')}
                         className="px-3 py-1 text-red-600 hover:text-red-700 text-sm font-medium"
                       >
                         Remove
                       </button>
                     </>
                   )}
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
