import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

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
  updated_at?: string;
  status?: 'pending' | 'accepted' | 'declined' | 'confirmed' | 'cancelled' | 'completed';
  event: Event;
}

const MyApplicationsManager: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadApplications();
  }, []);

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
      
      let query = supabase
        .from('bookings')
        .select(`
          id, event_id, musician_profile_id, quotation, additional_requirements, 
          created_at, status,
          event:events(id, title, starts_at, location)
        `)
        .eq('musician_profile_id', profile.id);
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading applications:', error);
        return;
      }
      
      // Normalize relation: some clients infer related rows as arrays
      const normalized = (data || []).map((d: any) => ({
        ...d,
        event: Array.isArray(d.event) ? d.event[0] : d.event,
      })) as Application[];
      setApplications(normalized);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmApplication = async (application: Application) => {
    if (!confirm(`Are you sure you want to confirm this application for $${application.quotation}?`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', application.id);
      
      if (error) {
        console.error('Error confirming application:', error);
        alert('Failed to confirm application. Please try again.');
        return;
      }
      
      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === application.id 
          ? { ...app, status: 'completed' }
          : app
      ));
      
      alert('Application confirmed! You are now committed to this event.');
    } catch (error) {
      console.error('Error confirming application:', error);
      alert('Failed to confirm application. Please try again.');
    }
  };

  const handleDeclineApplication = async (application: Application) => {
    if (!confirm(`Are you sure you want to decline this application? This will cancel your involvement in the event.`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', application.id);
      
      if (error) {
        console.error('Error declining application:', error);
        alert('Failed to decline application. Please try again.');
        return;
      }
      
      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === application.id 
          ? { ...app, status: 'cancelled' }
          : app
      ));
      
      alert('Application declined. The event organizer will be notified.');
    } catch (error) {
      console.error('Error declining application:', error);
      alert('Failed to decline application. Please try again.');
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status || status === 'pending') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending</span>;
    } else if (status === 'confirmed') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Accepted by Organizer</span>;
    } else if (status === 'completed') {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Confirmed</span>;
    } else if (status === 'declined') {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Declined</span>;
    } else if (status === 'cancelled') {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Cancelled</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Unknown</span>;
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

  const filteredApplications = applications.filter(app => 
    filterStatus === 'all' || app.status === filterStatus
  );

  return (
    <div className="bg-card ui-glass ui-vibrant-border rounded-xl shadow-sm border border-border p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">My Applications</h3>
        <p className="text-sm text-muted-foreground">
          Track the status of your applications and respond to event organizers
        </p>
      </div>
      
      {/* Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-muted-foreground mb-2">Filter by Status</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
        >
          <option value="all">All Applications</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Accepted by Organizer</option>
          <option value="completed">Confirmed by You</option>
          <option value="declined">Declined</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading applications...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-2">📝</div>
          <p>No applications found for the selected criteria.</p>
          <p className="text-sm text-muted-foreground mt-2">
            When you apply to events, you'll see your applications here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <div key={application.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors bg-card/50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-lg text-foreground">
                      {application.event.title}
                    </h4>
                    {getStatusBadge(application.status)}
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium">Date:</span> {formatDate(application.event.starts_at)}
                    {application.event.location && (
                      <span className="ml-2">📍 {application.event.location}</span>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Your Quote:</span> {formatCurrency(application.quotation || 0)}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    Applied: {formatDate(application.created_at)}
                  </div>
                </div>
              </div>

              {/* Additional Requirements */}
              {application.additional_requirements && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Your Requirements:</div>
                  <p className="text-sm text-muted-foreground">{application.additional_requirements}</p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-border flex gap-2">
                {application.status === 'confirmed' && (
                  <>
                    <button 
                      onClick={() => handleConfirmApplication(application)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Confirm Application
                    </button>
                    <button 
                      onClick={() => handleDeclineApplication(application)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Decline Application
                    </button>
                  </>
                )}
                
                {application.status === 'completed' && (
                  <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                    Confirmed ✅ - You're committed to this event
                  </span>
                )}
                
                {application.status === 'pending' && (
                  <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium">
                    Pending review by event organizer
                  </span>
                )}
                
                {(application.status === 'declined' || application.status === 'cancelled') && (
                  <span className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium">
                    {application.status === 'declined' ? 'Declined by organizer' : 'Cancelled by you'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {applications.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{applications.length}</div>
              <div className="text-sm text-muted-foreground">Total Applications</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {applications.filter(app => app.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Confirmed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {applications.filter(app => app.status === 'confirmed').length}
              </div>
              <div className="text-sm text-muted-foreground">Accepted by Organizer</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {applications.filter(app => app.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Under Review</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplicationsManager;
