import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SimpleBand {
  id: string;
  name: string;
  member_count: number;
}

interface BandActionSelectorProps {
  onSelect: (actionType: 'individual' | 'band', bandId?: string) => void;
  title?: string;
  description?: string;
  showHeader?: boolean; // default false to avoid duplication when embedded in pages with their own header
}

export default function BandActionSelector({ onSelect, title, description, showHeader = false }: BandActionSelectorProps) {
  const [userBands, setUserBands] = useState<SimpleBand[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBand, setSelectedBand] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserBands = async () => {
      setLoading(true);
      const { data: memberships, error: membershipsError } = await supabase
        .from('band_members')
        .select(`
          band_id,
          bands (
            id,
            name
          )
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (membershipsError) {
        console.error('Error fetching band memberships:', membershipsError);
        setLoading(false);
        return;
      }

      if (memberships && memberships.length > 0) {
        const bandsWithCounts = await Promise.all(
          memberships.map(async (membership: any) => {
            const band = Array.isArray(membership.bands) ? membership.bands[0] : membership.bands;
            if (!band) return null;

            const { count } = await supabase
              .from('band_members')
              .select('*', { count: 'exact', head: true })
              .eq('band_id', band.id);

            return {
              id: band.id,
              name: band.name,
              member_count: count || 0,
            };
          })
        );
        const validBands = bandsWithCounts.filter((band): band is SimpleBand => band !== null);
        setUserBands(validBands);
      }
      setLoading(false);
    };
    fetchUserBands();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="app-full-bleed">
        <div className="mx-auto max-w-7xl px-6 xl:px-12">
        {/* Optional Header */}
        {showHeader && (title || description) && (
          <div className="text-center mb-8">
            {title && <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>}
            {description && <p className="text-lg text-gray-600">{description}</p>}
          </div>
        )}

          {/* Main Container - Fixed Rounded Corners */}
          <div className="w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-10">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            {/* Individual Option */}
            <Card className="w-full rounded-2xl overflow-hidden h-full md:min-w-[360px]">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 h-full flex flex-col min-h-[360px] xl:min-h-[420px]">
                <div className="text-center flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <span className="text-4xl">👤</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Post as Individual</h3>
                    <p className="text-gray-600 mb-8">Post under your personal profile</p>
                  </div>
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onSelect('individual')}>
                    Choose Individual
                  </Button>
                </div>
              </div>
            </Card>

            {/* Band Option */}
            <Card className="w-full rounded-2xl overflow-hidden h-full md:min-w-[360px]">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 h-full flex flex-col min-h-[360px] xl:min-h-[420px]">
                <div className="text-center flex-1 flex flex-col gap-4">
                  <div>
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <span className="text-4xl">🎸</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Post as Band</h3>

                    {userBands.length > 0 ? (
                      <>
                        <p className="text-gray-600 mb-4">Select a band to post under</p>
                        <div className="space-y-2 max-h-56 overflow-y-auto mb-6 text-left">
                          {userBands.map((band) => {
                            const active = selectedBand === band.id;
                            return (
                              <button
                                key={band.id}
                                type="button"
                                onClick={() => setSelectedBand(band.id)}
                                className={`w-full p-3 rounded-2xl border transition-all ${active ? 'bg-white border-purple-300 shadow-sm' : 'bg-white/70 border-purple-200/60 hover:bg-white hover:border-purple-300'}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm text-gray-800">{band.name}</span>
                                  <span className={`text-xs px-3 py-1 rounded-full font-medium border ${active ? 'text-purple-700 bg-purple-100 border-purple-200' : 'text-purple-600 bg-purple-100 border-purple-200'}`}>
                                    {band.member_count} members
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <Button size="lg" disabled={!selectedBand} className="bg-fuchsia-600 hover:bg-fuchsia-700" onClick={() => selectedBand && onSelect('band', selectedBand)}>
                          {selectedBand ? 'Continue with Band' : 'Select a band'}
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-500 mb-6">No bands available</p>
                        <div className="flex flex-col items-center gap-4">
                          <Button size="lg" asChild variant="secondary" className="bg-white/70 hover:bg-white">
                            <Link to="/bands/create">Create a Band</Link>
                          </Button>
                          <Button size="lg" asChild variant="outline">
                            <Link to="/bands">Browse Bands</Link>
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
