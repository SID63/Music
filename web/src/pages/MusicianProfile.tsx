import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useParams, useNavigate, Link } from 'react-router-dom';
import MessageButton from '../components/MessageButton';
import { useAuth } from '../context/AuthContext';

type Musician = {
  id: string;
  display_name: string | null;
  genres: string[] | null;
  location: string | null;
  price_min: number | null;
  price_max: number | null;
  youtube_url: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type Band = {
  id: string;
  name: string;
  description: string | null;
  role: string;
  joined_at: string;
};

export default function MusicianProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile: currentProfile, user } = useAuth();
  const [musician, setMusician] = useState<Musician | null>(null);
  const [bands, setBands] = useState<Band[]>([]);
  const [loadingBands, setLoadingBands] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      // Load musician profile
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, genres, location, price_min, price_max, youtube_url, bio, avatar_url')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error loading musician profile:', error);
        navigate('/musicians');
        return;
      }
      
      setMusician(data as unknown as Musician);

      // Load bands for this musician
      await loadBands(id);
    };
    
    const loadBands = async (profileId: string) => {
      try {
        setLoadingBands(true);
        
        // First get the user_id for this profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('id', profileId)
          .single();

        if (profileError || !profileData?.user_id) {
          console.error('Error getting user_id for profile:', profileError);
          setLoadingBands(false);
          return;
        }

        // Then get bands where this user is a member
        const { data: bandMembers, error: bandError } = await supabase
          .from('band_members')
          .select(`
            band_id,
            role,
            joined_at,
            bands!inner (
              id,
              name,
              description
            )
          `)
          .eq('user_id', profileData.user_id);

        if (bandError) {
          console.error('Error loading bands:', bandError);
        } else if (bandMembers) {
          const bandsData: Band[] = bandMembers.map(member => ({
            id: member.bands.id,
            name: member.bands.name,
            description: member.bands.description,
            role: member.role,
            joined_at: member.joined_at
          }));
          setBands(bandsData);
        }
      } catch (error) {
        console.error('Error in loadBands:', error);
      } finally {
        setLoadingBands(false);
      }
    };

    load();
  }, [id, navigate]);

  const getGenreColor = (genre: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-green-100 text-green-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-teal-100 text-teal-800',
      'bg-red-100 text-red-800'
    ];
    const index = genre.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (!musician) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <p className="text-xl text-gray-600 font-medium">Loading musician profile...</p>
      </div>
    </div>
  );

  const videoIdMatch = musician.youtube_url?.match(/[?&]v=([^&#]+)/) || musician.youtube_url?.match(/youtu\.be\/([^?&#]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-32"></div>
          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between -mt-16 mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {musician.avatar_url ? (
                  <img src={musician.avatar_url} alt="avatar" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl" />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                    <span className="text-4xl text-white">🎵</span>
                  </div>
                )}
                <div className="text-center md:text-left">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{musician.display_name ?? 'Musician'}</h1>
                  {musician.location && (
                    <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 mb-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-lg">{musician.location}</span>
                    </div>
                  )}
                  {musician.genres && musician.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      {musician.genres.map((genre, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getGenreColor(genre)}`}
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
                <MessageButton 
                  recipientProfileId={musician.id} 
                  recipientName={musician.display_name || 'Musician'} 
                />
                {currentProfile && currentProfile.id !== musician.id && (
                  <button
                    onClick={() => navigate(`/reviews/add/${musician.id}`)}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Add Review
                  </button>
                )}
              </div>
            </div>

            {/* Pricing Section */}
            {(musician.price_min || musician.price_max) && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Pricing Information
                </h2>
                <p className="text-3xl font-bold text-green-600">
                  ${musician.price_min ?? '0'} - ${musician.price_max ?? 'No max'}
                </p>
                <p className="text-gray-600 mt-2">Contact for custom quotes and availability</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio Section */}
            {musician.bio && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  About the Musician
                </h2>
                <p className="text-gray-700 leading-relaxed text-lg">{musician.bio}</p>
              </div>
            )}

            {/* Bands Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                Band Memberships
              </h2>
              {loadingBands ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
                  <p className="text-gray-600">Loading band information...</p>
                </div>
              ) : bands.length > 0 ? (
                <div className="space-y-4">
                  {bands.map((band) => (
                    <div key={band.id} className="border-2 border-gray-100 rounded-xl p-6 hover:border-purple-200 hover:bg-purple-50 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-gray-900">{band.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              band.role === 'leader' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {band.role === 'leader' ? '👑 Leader' : '🎵 Member'}
                            </span>
                          </div>
                          {band.description && (
                            <p className="text-gray-700 mb-3 leading-relaxed">{band.description}</p>
                          )}
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Joined: {new Date(band.joined_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <div className="text-4xl mb-3">🎵</div>
                  <p className="text-lg">This musician is not currently part of any bands.</p>
                </div>
              )}
            </div>

            {/* YouTube Video Section */}
            {videoId && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  Sample Performance
                </h2>
                <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="YouTube video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Reviews Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Reviews & Ratings
              </h2>
              <Link
                to={`/reviews/${musician.id}`}
                className="inline-flex items-center w-full justify-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                View All Reviews
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Book for Event
                </button>
                <button className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Add to Favorites
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


