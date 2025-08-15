import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import EnvCheck from './EnvCheck';

const ConnectionTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');
  const [authStatus, setAuthStatus] = useState<string>('Testing...');
  const [dataTest, setDataTest] = useState<string>('Testing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      // Test 1: Check if Supabase client is configured
      if (!supabase) {
        setConnectionStatus('❌ Supabase client is null');
        return;
      }

      setConnectionStatus('✅ Supabase client configured');

      // Test 2: Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        setAuthStatus(`❌ Auth error: ${authError.message}`);
      } else if (user) {
        setAuthStatus(`✅ Authenticated as: ${user.email}`);
      } else {
        setAuthStatus('❌ Not authenticated');
      }

      // Test 3: Test data access
      const { data: profiles, error: dataError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .limit(1);

      if (dataError) {
        setDataTest(`❌ Data access error: ${dataError.message}`);
        setError(dataError.message);
      } else {
        setDataTest(`✅ Data access working. Found ${profiles?.length || 0} profiles`);
      }

    } catch (err) {
      setConnectionStatus('❌ Connection failed');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const testBandAccess = async () => {
    try {
      const { data: bands, error } = await supabase
        .from('bands')
        .select('id, name')
        .limit(5);

      if (error) {
        alert(`Band access error: ${error.message}`);
      } else {
        alert(`Band access working. Found ${bands?.length || 0} bands`);
      }
    } catch (err) {
      alert(`Band test error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const testEventCreation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Not authenticated');
        return;
      }

      const testEvent = {
        organizer_profile_id: '59344a53-55ec-49a1-9764-1d03df276c92', // hsh's profile
        title: 'Connection Test Event',
        description: 'Testing event creation',
        location: 'Test Location',
        event_type: 'gig',
        genres: ['test'],
        starts_at: new Date(Date.now() + 86400000).toISOString(), // tomorrow
        posted_by_type: 'individual'
      };

      const { data, error } = await supabase
        .from('events')
        .insert(testEvent)
        .select();

      if (error) {
        alert(`Event creation error: ${error.message}`);
      } else {
        alert(`Event creation successful! Created event ID: ${data?.[0]?.id}`);
      }
    } catch (err) {
      alert(`Event test error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Supabase Connection Test</h2>
      
      <div className="space-y-3">
        <div>
          <strong>Connection:</strong> {connectionStatus}
        </div>
        <div>
          <strong>Authentication:</strong> {authStatus}
        </div>
        <div>
          <strong>Data Access:</strong> {dataTest}
        </div>
        
        {error && (
          <div className="text-red-600">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      <div className="mt-6 space-y-2">
        <button
          onClick={testBandAccess}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test Band Access
        </button>
        
        <button
          onClick={testEventCreation}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Test Event Creation
        </button>
        
        <button
          onClick={testConnection}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Re-run All Tests
        </button>
      </div>

      <EnvCheck />
    </div>
  );
};

export default ConnectionTest;
