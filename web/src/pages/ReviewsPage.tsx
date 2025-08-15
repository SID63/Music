import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

type Review = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_profile: {
    display_name: string;
    avatar_url?: string;
    role: string;
  };
  booking: {
    event: {
      title: string;
      date: string;
    };
  };
};

type MusicianProfile = {
  id: string;
  display_name: string;
  avatar_url?: string;
  role: string;
};

export default function ReviewsPage() {
  const { musicianId } = useParams<{ musicianId: string }>();
  const { profile: currentProfile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [musician, setMusician] = useState<MusicianProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    if (musicianId) {
      loadMusicianAndReviews();
    }
  }, [musicianId]);

  const loadMusicianAndReviews = async () => {
    if (!musicianId) return;
    
    try {
      setLoading(true);
      
      // Load musician profile
      const { data: musicianData, error: musicianError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, role')
        .eq('id', musicianId)
        .single();

      if (musicianError) {
        console.error('Error loading musician:', musicianError);
        return;
      }

      setMusician(musicianData);

      // Load reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          reviewer_profile:profiles!reviews_reviewer_profile_id_fkey(
            display_name,
            avatar_url,
            role
          ),
          booking:bookings!bookings_event_id_fkey(
            event:events!bookings_event_id_fkey(
              title,
              starts_at
            )
          )
        `)
        .eq('reviewee_profile_id', musicianId)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error loading reviews:', reviewsError);
        return;
      }

      setReviews(reviewsData || []);

      // Calculate average rating
      if (reviewsData && reviewsData.length > 0) {
        const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(totalRating / reviewsData.length);
        setTotalReviews(reviewsData.length);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`text-xl ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
            ★
          </span>
        ))}
        <span className="text-sm text-gray-600 ml-2">({rating})</span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-medium">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (!musician) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Musician Not Found</h2>
          <p className="text-gray-600">The musician you're looking for doesn't exist.</p>
          <Link to="/musicians" className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
            Browse Musicians
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
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
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{musician.display_name}</h1>
                  <p className="text-lg text-gray-600 mb-4 capitalize">{musician.role}</p>
                  
                  {/* Rating Summary */}
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600">{averageRating.toFixed(1)}</div>
                      <div className="text-sm text-gray-600">Average Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{totalReviews}</div>
                      <div className="text-sm text-gray-600">Total Reviews</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {reviews.filter(r => r.rating >= 4).length}
                      </div>
                      <div className="text-sm text-gray-600">5-Star Reviews</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0">
                <Link
                  to={`/reviews/add/${musician.id}`}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Write a Review
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Reviews & Ratings</h2>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">⭐</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Reviews Yet</h3>
              <p className="text-gray-600 text-lg mb-6">
                {musician.display_name} hasn't received any reviews yet. Be the first to share your experience!
              </p>
              <Link
                to={`/reviews/add/${musician.id}`}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Write First Review
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-2 border-gray-100 rounded-xl p-6 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {review.reviewer_profile.avatar_url ? (
                        <img 
                          src={review.reviewer_profile.avatar_url} 
                          alt="reviewer" 
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {review.reviewer_profile.display_name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">
                          {review.reviewer_profile.display_name}
                        </h4>
                        <p className="text-gray-600 capitalize">{review.reviewer_profile.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">
                        {formatDate(review.created_at)}
                      </div>
                      {review.booking?.event && (
                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          {review.booking.event.title}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    {renderStars(review.rating)}
                  </div>
                  
                  <p className="text-gray-700 leading-relaxed text-lg">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back to Musician Profile */}
        <div className="text-center mt-8">
          <Link
            to={`/musicians/${musician.id}`}
            className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to {musician.display_name}'s Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
