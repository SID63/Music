import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import type { Profile } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function MusicianDirectory() {
  const [musicians, setMusicians] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
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
    
    const matchesGenre = selectedGenre === 'all' || musician.genres?.includes(selectedGenre);
    
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
        <Card className="shadow-xl border-0 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="search">Search Musicians</Label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <Input
                    id="search"
                    type="text"
                    placeholder="Name, bio, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="genre">Music Genre</Label>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Genres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    {allGenres.map(genre => (
                      <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price Range</Label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Prices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="low">Under $200</SelectItem>
                    <SelectItem value="medium">$200 - $1000</SelectItem>
                    <SelectItem value="high">Over $500</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedGenre('all');
                    setPriceRange('all');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-8">
          <Card className="shadow-sm border-0">
            <CardContent className="pt-6">
              <p className="text-gray-700 font-medium">
                <span className="text-blue-600 font-bold">{filteredMusicians.length}</span> of {musicians.length} musicians found
              </p>
            </CardContent>
          </Card>
          {filteredMusicians.length > 0 && (
            <div className="text-sm text-gray-500">
              {searchTerm || selectedGenre !== 'all' || priceRange !== 'all' ? 'Filtered results' : 'All musicians'}
            </div>
          )}
        </div>

        {/* Musician Cards */}
        {filteredMusicians.length === 0 ? (
          <Card className="text-center py-16 shadow-xl border-0">
            <CardContent>
              <div className="text-8xl mb-6">🎵</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No musicians found</h3>
              <p className="text-gray-600 text-lg mb-6">Try adjusting your search criteria or browse all musicians</p>
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedGenre('all');
                  setPriceRange('all');
                }}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Show All Musicians
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMusicians.map((musician) => (
              <Card key={musician.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-xl">
                {/* Card Header */}
                <div className="relative h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                  <Avatar className="w-32 h-32 mx-auto mt-8 border-4 border-white shadow-lg">
                    <AvatarImage 
                      src={musician.avatar_url} 
                      alt={musician.display_name}
                    />
                    <AvatarFallback className="text-2xl font-bold">
                      {musician.display_name?.[0]?.toUpperCase() || 'M'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Card Content */}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl mb-2">{musician.display_name || 'Musician'}</CardTitle>
                  <div className="flex flex-wrap gap-2 justify-center mb-3">
                    {musician.genres?.slice(0, 3).map((genre) => (
                      <Badge key={genre} variant="secondary" className={getGenreColor(genre)}>
                        {genre}
                      </Badge>
                    ))}
                    {musician.genres && musician.genres.length > 3 && (
                      <Badge variant="outline">+{musician.genres.length - 3} more</Badge>
                    )}
                  </div>
                  {musician.location && (
                    <div className="flex items-center justify-center text-gray-600 text-sm">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {musician.location}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="pt-0">
                  {musician.bio && (
                    <p className="text-gray-600 text-sm text-center mb-4 line-clamp-3">
                      {musician.bio}
                    </p>
                  )}
                  
                  {musician.price_min && musician.price_max && (
                    <div className="text-center mb-4">
                      <span className="text-lg font-bold text-green-600">
                        ${musician.price_min} - ${musician.price_max}
                      </span>
                      <p className="text-xs text-gray-500">per event</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button asChild className="flex-1" variant="outline">
                      <Link to={`/musicians/${musician.id}`}>
                        View Profile
                      </Link>
                    </Button>
                    <Button asChild className="flex-1">
                      <Link to={`/messages?conversation=${musician.id}`}>
                        Message
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


