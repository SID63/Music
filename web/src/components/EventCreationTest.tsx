import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

const EventCreationTest: React.FC = () => {
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testEventCreation = async () => {
    if (!profile) {
      setError('No profile found');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setResult('');

    try {
      // Step 1: Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        setError(`Auth error: ${authError.message}`);
        return;
      }
      if (!user) {
        setError('No authenticated user');
        return;
      }
      setResult(`✅ Authenticated as: ${user.email}\n`);

      // Step 2: Check if we can read from profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, role')
        .eq('user_id', user.id);

      if (profilesError) {
        setError(`Profiles read error: ${profilesError.message}`);
        return;
      }
      setResult(prev => prev + `✅ Found profile: ${profiles?.[0]?.display_name}\n`);

      // Step 3: Create test event data
      const testEvent = {
        organizer_profile_id: profile.id,
        title: 'Test Event - ' + new Date().toISOString(),
        description: 'This is a test event created via the test component',
        location: 'Test Location',
        event_type: 'gig',
        genres: ['test'],
        starts_at: new Date(Date.now() + 86400000).toISOString(), // tomorrow
        ends_at: new Date(Date.now() + 172800000).toISOString(), // day after tomorrow
        budget_min: 100,
        budget_max: 500,
        contact_email: user.email || 'test@example.com',
        contact_phone: '123-456-7890',
        requirements: 'Test requirements',
        equipment_provided: 'Test equipment',
        parking_info: 'Test parking',
        additional_notes: 'Test notes',
        posted_by_type: 'individual'
      };

      setResult(prev => prev + `📝 Attempting to create event with data:\n${JSON.stringify(testEvent, null, 2)}\n`);

      // Step 4: Insert the event
      const { data, error: insertError } = await supabase
        .from('events')
        .insert(testEvent)
        .select();

      if (insertError) {
        setError(`Event creation failed: ${insertError.message}`);
        setResult(prev => prev + `❌ Insert error: ${insertError.message}\n`);
        return;
      }

      setResult(prev => prev + `✅ Event created successfully!\nEvent ID: ${data?.[0]?.id}\n`);

      // Step 5: Verify the event was created
      const { data: events, error: readError } = await supabase
        .from('events')
        .select('*')
        .eq('id', data?.[0]?.id);

      if (readError) {
        setError(`Event read error: ${readError.message}`);
        return;
      }

      setResult(prev => prev + `✅ Event verified in database: ${events?.[0]?.title}\n`);

    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkEventsTable = async () => {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        setError(`Events read error: ${error.message}`);
        return;
      }

      setResult(`📊 Current events in database:\n${events?.length || 0} events found\n`);
      events?.forEach((event, index) => {
        setResult(prev => prev + `${index + 1}. ${event.title} (${event.id})\n`);
      });
    } catch (err) {
      setError(`Error checking events: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Event Creation Test</h2>
      
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Current Profile:</h3>
          <pre className="text-sm text-blue-700 bg-blue-100 p-2 rounded">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <button
          onClick={testEventCreation}
          disabled={isSubmitting}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Testing...' : 'Test Event Creation'}
        </button>

        <button
          onClick={checkEventsTable}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Check Events Table
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Test Results:</h3>
          <pre className="text-sm text-gray-700 bg-white p-3 rounded border overflow-auto max-h-96">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
};

export default EventCreationTest;
