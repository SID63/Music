import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import type { Profile } from '../context/AuthContext';

export default function MusicianDirectory() {
  const [musicians, setMusicians] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [priceRange, setPriceRange] = useState('all');

  useEffect(() => {
    fetchMusicians();
  }, []);

  const fetchMusicians = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'musician');

      if (error) throw error;
      setMusicians(data || []);
    } catch (error) {
      console.error('Error fetching musicians:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMusicians = musicians.filter(musician => {
    const matchesSearch = musician.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         musician.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         musician.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGenre = !selectedGenre || musician.genres?.includes(selectedGenre);
    
    const matchesPrice = priceRange === 'all' || 
      (priceRange === 'low' && musician.price_max && musician.price_max <= 200) ||
      (priceRange === 'medium' && musician.price_min && musician.price_max && 
       musician.price_min <= 500 && musician.price_max <= 1000) ||
      (priceRange === 'high' && musician.price_min && musician.price_min > 500);

    return matchesSearch && matchesGenre && matchesPrice;
  });

  const allGenres = Array.from(new Set(musicians.flatMap(m => m.genres || []))).sort();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-medium">Discovering amazing musicians...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎵</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Find Amazing <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Musicians</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover talented musicians and bands for your next event. From jazz ensembles to rock bands, 
            find the perfect sound to make your event unforgettable.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Search & Filter</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Search Musicians</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Name, bio, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Music Genre</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
              >
                <option value="">All Genres</option>
                {allGenres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Price Range</label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
              >
                <option value="all">All Prices</option>
                <option value="low">Under $200</option>
                <option value="medium">$200 - $1000</option>
                <option value="high">Over $500</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedGenre('');
                  setPriceRange('all');
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-8">
          <div className="bg-white rounded-xl px-6 py-3 shadow-sm border border-gray-200">
            <p className="text-gray-700 font-medium">
              <span className="text-blue-600 font-bold">{filteredMusicians.length}</span> of {musicians.length} musicians found
            </p>
          </div>
          {filteredMusicians.length > 0 && (
            <div className="text-sm text-gray-500">
              {searchTerm || selectedGenre || priceRange !== 'all' ? 'Filtered results' : 'All musicians'}
            </div>
          )}
        </div>

        {/* Musician Cards */}
        {filteredMusicians.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-xl border border-gray-200">
            <div className="text-8xl mb-6">🎵</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No musicians found</h3>
            <p className="text-gray-600 text-lg mb-6">Try adjusting your search criteria or browse all musicians</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedGenre('');
                setPriceRange('all');
              }}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Show All Musicians
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMusicians.map((musician) => (
              <div key={musician.id} className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                {/* Card Header */}
                <div className="relative h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                  <img
                    src={musician.avatar_url || `data:image/svg+xml;base64,${btoa(`
                      <svg width="400" height="200" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="400" height="200" fill="#6B7280"/>
                        <text x="200" y="110" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">No Image</text>
                      </svg>
                    `)}`}
                    alt={musician.display_name || 'Musician'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
                        <svg width="400" height="200" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="400" height="200" fill="#6B7280"/>
                          <text x="200" y="110" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">No Image</text>
                        </svg>
                      `)}`;
                    }}
                  />
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-white bg-opacity-95 text-gray-800 rounded-full text-sm font-semibold shadow-lg">
                      {musician.is_band ? '🎸 Band' : '🎵 Musician'}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <h3 className="text-xl font-bold text-white">
                      {musician.display_name || 'Unnamed Musician'}
                    </h3>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-4">
                  {musician.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">{musician.location}</span>
                    </div>
                  )}

                  {musician.bio && (
                    <p className="text-gray-700 leading-relaxed line-clamp-3">
                      {musician.bio}
                    </p>
                  )}

                  {musician.genres && musician.genres.length > 0 && (
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-3 block">Musical Genres</label>
                      <div className="flex flex-wrap gap-2">
                        {musician.genres.slice(0, 4).map((genre, index) => (
                          <span
                            key={index}
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getGenreColor(genre)}`}
                          >
                            {genre}
                          </span>
                        ))}
                        {musician.genres.length > 4 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                            +{musician.genres.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {(musician.price_min || musician.price_max) && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">Pricing Range</label>
                      <p className="text-xl font-bold text-green-600">
                        ${musician.price_min || '0'} - ${musician.price_max || 'No max'}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <Link
                      to={`/musicians/${musician.id}`}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      View Profile
                    </Link>
                    {musician.youtube_url && (
                      <a
                        href={musician.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        title="Watch on YouTube"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


