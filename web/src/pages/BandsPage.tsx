import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bandService } from '../services/bandService';
import type { Band, BandRequest } from '../types/band';
import LoadingScreen from '../components/LoadingScreen';
import { useAuth } from '../context/AuthContext';

export default function BandsPage() {
  const { profile } = useAuth();
  const [allBands, setAllBands] = useState<Band[]>([]);
  const [userBands, setUserBands] = useState<Band[]>([]);
  const [bandRequests, setBandRequests] = useState<BandRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'my-bands' | 'requests'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all bands (for organizers and musicians)
      const { data: bandsData, error: bandsError } = await bandService.getBands();
      if (bandsError) {
        console.error('Error loading bands:', bandsError);
        setError('Failed to load bands. Please try again.');
        return;
      }
      setAllBands(bandsData || []);

      // If user is a musician, load additional data
      if (profile?.role === 'musician') {
        try {
          // Load user's bands
          const { data: userBandsData, error: userBandsError } = await bandService.getUserBands(profile.user_id);
          if (userBandsError) {
            console.error('Error loading user bands:', userBandsError);
            // Don't return here, continue with other operations
          } else {
            setUserBands(userBandsData || []);
          }

          // Load band requests
          const { data: requestsData, error: requestsError } = await bandService.getPendingRequests();
          if (requestsError) {
            console.error('Error loading band requests:', requestsError);
            // Don't return here, continue with other operations
          } else {
            setBandRequests(requestsData || []);
          }
        } catch (err) {
          console.error('Error in loading user-specific band data:', err);
          setError('Failed to load user-specific band data. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error in loadData:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await bandService.acceptRequest(requestId);
      if (error) {
        console.error('Error accepting request:', error);
        alert('Failed to accept request. Please try again.');
      } else {
        // Reload requests
        const { data: requestsData } = await bandService.getPendingRequests();
        setBandRequests(requestsData || []);
      }
    } catch (err) {
      console.error('Error accepting request:', err);
      alert('An unexpected error occurred.');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await bandService.rejectRequest(requestId);
      if (error) {
        console.error('Error rejecting request:', error);
        alert('Failed to reject request. Please try again.');
      } else {
        // Reload requests
        const { data: requestsData } = await bandService.getPendingRequests();
        setBandRequests(requestsData || []);
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert('An unexpected error occurred.');
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading bands..." />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const renderBandCard = (band: Band) => (
    <div 
      key={band.id}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 truncate" id={`band-name-${band.id}`}>
            {band.name}
          </h3>
          <div className="flex items-center text-sm text-gray-500">
            <span className="mr-1" aria-hidden="true">👥</span>
            <span>{band.member_count || 0} members</span>
          </div>
        </div>
        
        {band.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {band.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Created {new Date(band.created_at).toLocaleDateString()}</span>
          <Link
            to={`/bands/${band.id}`}
            className="text-blue-600 font-medium hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1 -mr-2"
            aria-label={`View details for ${band.name}`}
          >
            View Details <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );

  const renderRequestCard = (request: BandRequest) => (
    <div key={request.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {request.band?.name || 'Unknown Band'}
          </h3>
          <p className="text-sm text-gray-600">
            Request from: {request.requester?.display_name || 'Unknown User'}
          </p>
        </div>
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
          Pending
        </span>
      </div>
      
      {request.message && (
        <p className="text-gray-600 text-sm mb-4">
          "{request.message}"
        </p>
      )}
      
      <div className="flex gap-2">
        <button
          onClick={() => handleAcceptRequest(request.id)}
          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
        >
          Accept
        </button>
        <button
          onClick={() => handleRejectRequest(request.id)}
          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bands</h1>
            <p className="text-gray-600 mt-2">
              {profile?.role === 'organizer' 
                ? 'Browse bands to find musicians for your events'
                : 'Discover bands and manage your memberships'
              }
            </p>
          </div>
          {profile?.role === 'musician' && (
            <Link
              to="/bands/create"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create Band
            </Link>
          )}
        </div>
      </div>

      {/* Tabs for Musicians */}
      {profile?.role === 'musician' && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Bands ({allBands.length})
              </button>
              <button
                onClick={() => setActiveTab('my-bands')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-bands'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Bands ({userBands.length})
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Requests ({bandRequests.length})
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {profile?.role === 'organizer' ? (
        // Organizers only see all bands
        <div>
          {allBands.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🎵</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bands Found</h3>
              <p className="text-gray-600">No bands are currently available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allBands.map(renderBandCard)}
            </div>
          )}
        </div>
      ) : (
        // Musicians see different content based on active tab
        <div>
          {activeTab === 'all' && (
            <div>
              {allBands.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🎵</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bands Found</h3>
                  <p className="text-gray-600 mb-6">Be the first to create a band and start making music together!</p>
                  <Link
                    to="/bands/create"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Create Your First Band
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allBands.map(renderBandCard)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'my-bands' && (
            <div>
              {userBands.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🎸</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Not in Any Bands</h3>
                  <p className="text-gray-600 mb-6">You're not currently a member of any bands.</p>
                  <Link
                    to="/bands/create"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Create a Band
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userBands.map(renderBandCard)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              {bandRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Requests</h3>
                  <p className="text-gray-600">You don't have any pending band requests.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bandRequests.map(renderRequestCard)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
