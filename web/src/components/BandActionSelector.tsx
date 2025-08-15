import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bandService } from '../services/bandService';
import { supabase } from '../lib/supabaseClient';
import type { Band } from '../types/band';

interface BandActionSelectorProps {
  onSelect: (actionType: 'individual' | 'band', bandId?: string) => void;
  title?: string;
  description?: string;
  className?: string;
}

const BandActionSelector: React.FC<BandActionSelectorProps> = ({
  onSelect,
  title = "Choose Action Type",
  description = "Select whether to perform this action as an individual or as a band leader",
  className = ""
}) => {
  const { profile } = useAuth();
  const [userBands, setUserBands] = useState<Band[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'individual' | 'band'>('individual');
  const [selectedBandId, setSelectedBandId] = useState<string>('');
  const [isMounted, setIsMounted] = useState(true);

                                               useEffect(() => {
            // Start loading bands immediately
            loadUserBands();
            
            // Add a fallback timeout only if loading takes too long
            const fallbackTimeout = setTimeout(() => {
              if (loading && isMounted) {
                console.log('Band loading taking too long, continuing with current state');
                setLoading(false);
              }
            }, 5000); // 5 seconds fallback
            
            return () => {
              clearTimeout(fallbackTimeout);
              setIsMounted(false);
            };
          }, []);
          
          // Debug effect to monitor userBands changes
          useEffect(() => {
            console.log('userBands state changed:', userBands);
          }, [userBands]);

                       const loadUserBands = async () => {
            if (!profile) return;

            try {
              setLoading(true);
              console.log('Loading bands for user:', profile.user_id);
              
              // Direct query to get bands where user is a leader
              const { data: leaderMemberships, error: leaderError } = await supabase
                .from('band_members')
                .select('band_id')
                .eq('user_id', profile.user_id)
                .eq('role', 'leader');

              console.log('Leader memberships loaded:', leaderMemberships, 'Error:', leaderError);

                             if (leaderError) {
                 console.error('Error loading leader memberships:', leaderError);
                 if (isMounted) {
                   setUserBands([]);
                   setLoading(false);
                 }
                 return;
               }

              // Get band details and member counts
              const bandsWithCounts = await Promise.all(
                (leaderMemberships || []).map(async (membership) => {
                  // Get band details
                  const { data: bandData, error: bandError } = await supabase
                    .from('bands')
                    .select('id, name, description, created_at')
                    .eq('id', membership.band_id)
                    .eq('is_active', true)
                    .single();
                  
                  if (bandError || !bandData) return null;
                  
                  // Get member count
                  const { count, error: countError } = await supabase
                    .from('band_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('band_id', bandData.id);

                  return {
                    ...bandData,
                    member_count: count || 0
                  };
                })
              );

                             const validBands = bandsWithCounts.filter(Boolean);
               console.log('Leader bands found:', validBands);
                              console.log('Setting userBands state to:', validBands);

               if (isMounted) {
                 setUserBands(validBands);

                 // Set first band as default if available
                 if (validBands.length > 0) {
                   setSelectedBandId(validBands[0].id);
                 }
                 
                 console.log('Band loading completed successfully, setting loading to false');
                 setLoading(false);
               }
             } catch (error) {
               console.error('Error loading user bands:', error);
               // Auto-continue with empty bands on any error
               if (isMounted) {
                 setUserBands([]);
                 setLoading(false);
               }
             }
          };

  const handleSubmit = () => {
    if (selectedType === 'band' && !selectedBandId) {
      alert('Please select a band');
      return;
    }
    
    onSelect(selectedType, selectedType === 'band' ? selectedBandId : undefined);
  };

                       if (loading) {
            return (
              <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading your bands...</p>
                  <p className="text-xs text-gray-500 mt-1">This will auto-skip if bands can't be loaded</p>
                  <button
                    onClick={() => {
                      setLoading(false);
                      setUserBands([]);
                    }}
                    className="mt-4 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Skip now
                  </button>
                </div>
              </div>
            );
          }

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      <div className="space-y-4">
        {/* Individual Option */}
        <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input
            type="radio"
            id="individual"
            name="actionType"
            value="individual"
            checked={selectedType === 'individual'}
            onChange={(e) => setSelectedType(e.target.value as 'individual' | 'band')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <label htmlFor="individual" className="flex-1 cursor-pointer">
            <div className="font-medium text-gray-900">As Individual</div>
            <div className="text-sm text-gray-600">
              Perform this action as {profile?.display_name || 'yourself'}
            </div>
          </label>
        </div>

        {/* Band Option */}
        {userBands.length > 0 && (
          <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="radio"
              id="band"
              name="actionType"
              value="band"
              checked={selectedType === 'band'}
              onChange={(e) => setSelectedType(e.target.value as 'individual' | 'band')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <label htmlFor="band" className="flex-1 cursor-pointer">
              <div className="font-medium text-gray-900">As Band Leader</div>
              <div className="text-sm text-gray-600">
                Perform this action on behalf of one of your bands
              </div>
            </label>
          </div>
        )}

        {/* Band Selection Dropdown */}
        {selectedType === 'band' && userBands.length > 0 && (
          <div className="ml-7 mt-3">
            <label htmlFor="bandSelect" className="block text-sm font-medium text-gray-700 mb-2">
              Select Band
            </label>
            <select
              id="bandSelect"
              value={selectedBandId}
              onChange={(e) => setSelectedBandId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {userBands.map(band => (
                <option key={band.id} value={band.id}>
                  {band.name} ({band.member_count || 0} members)
                </option>
              ))}
            </select>
          </div>
        )}

                 {/* No Bands Message */}
         {userBands.length === 0 && (
           <div className="ml-7 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
             <div className="text-sm text-blue-800">
               <div className="font-medium mb-1">No bands available</div>
               <p>You can post events as an individual. To post as a band, you need to be a leader of a band.</p>
             </div>
           </div>
         )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={handleSubmit}
          disabled={selectedType === 'band' && !selectedBandId}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default BandActionSelector;
