import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface SimpleBand {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  member_count: number;
}

export default function BandActionSelector() {
  const { profile } = useAuth();
  const [userBands, setUserBands] = useState<SimpleBand[]>([]);
  const [selectedBandId, setSelectedBandId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserBands();
  }, []);

  const loadUserBands = async () => {
    if (!profile?.user_id) return;

    try {
      setLoading(true);
      
      // Get user's band memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('band_members')
        .select(`
          band_id,
          role,
          bands (
            id,
            name,
            description,
            created_at
          )
        `)
        .eq('user_id', profile.user_id);

      if (membershipsError) {
        console.error('Error loading band memberships:', membershipsError);
        return;
      }

      if (memberships && memberships.length > 0) {
        // Extract band data and get member counts
        const bandsWithCounts = await Promise.all(
          memberships.map(async (membership: any) => {
            const band = membership.bands;
            if (!band) return null;

            // Get member count for this band
            const { count } = await supabase
              .from('band_members')
              .select('*', { count: 'exact', head: true })
              .eq('band_id', band.id);

            return {
              ...band,
              member_count: count || 0
            };
          })
        );

        // Filter out null values and set state
        const validBands = bandsWithCounts.filter((band): band is SimpleBand => band !== null);
        setUserBands(validBands);
        
        if (validBands.length > 0) {
          setSelectedBandId(validBands[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading user bands:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading bands...</div>;
  }

  if (userBands.length === 0) {
    return <div>You're not a member of any bands.</div>;
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Select a Band</h3>
      <div className="space-y-2">
        {userBands.map((band) => (
          <div
            key={band.id}
            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedBandId === band.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedBandId(band.id)}
          >
            <div className="font-medium">{band.name}</div>
            <div className="text-sm text-gray-600">
              {band.member_count} members
            </div>
          </div>
        ))}
      </div>
      
      {selectedBandId && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Selected: {userBands.find(b => b.id === selectedBandId)?.name}
          </p>
        </div>
      )}
    </div>
  );
}
