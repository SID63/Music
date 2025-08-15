import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

const BandLeadershipTest: React.FC = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    
    const testBandLeadership = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Testing band leadership for user:', profile.user_id);
        
        // Test 1: Direct query for leader memberships
        const { data: leaderMemberships, error: leaderError } = await supabase
          .from('band_members')
          .select(`
            band_id,
            role,
            band:bands(
              id,
              name,
              description,
              is_active
            )
          `)
          .eq('user_id', profile.user_id)
          .eq('role', 'leader');

        console.log('Leader memberships:', leaderMemberships, 'Error:', leaderError);

        // Test 2: Check if bands are active
        const activeBands = leaderMemberships?.filter(m => m.band?.is_active) || [];
        
        // Test 3: Get member counts
        const bandsWithCounts = await Promise.all(
          activeBands.map(async (membership) => {
            const { count } = await supabase
              .from('band_members')
              .select('*', { count: 'exact', head: true })
              .eq('band_id', membership.band_id);
            
            return {
              ...membership.band,
              member_count: count || 0
            };
          })
        );

        setResults({
          profile,
          leaderMemberships,
          activeBands: bandsWithCounts,
          leaderError
        });
        
      } catch (err) {
        console.error('Test error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    testBandLeadership();
  }, [profile]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Band Leadership Test</h1>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Testing band leadership...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Band Leadership Test</h1>
      
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Test Results</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900">Profile Info:</h3>
            <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(results?.profile, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">Leader Memberships:</h3>
            <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(results?.leaderMemberships, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">Active Bands (Leader):</h3>
            <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(results?.activeBands, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">Summary:</h3>
            <div className="bg-blue-50 p-3 rounded">
              <p><strong>User ID:</strong> {profile?.user_id}</p>
              <p><strong>Display Name:</strong> {profile?.display_name}</p>
              <p><strong>Leader Memberships:</strong> {results?.leaderMemberships?.length || 0}</p>
              <p><strong>Active Bands as Leader:</strong> {results?.activeBands?.length || 0}</p>
              {results?.activeBands?.length > 0 && (
                <div className="mt-2">
                  <p><strong>Your Bands:</strong></p>
                  <ul className="list-disc list-inside">
                    {results.activeBands.map((band: any) => (
                      <li key={band.id}>{band.name} ({band.member_count} members)</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BandLeadershipTest;
