import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

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
      starts_at: string;
    };
  };
};

type ReviewDisplayProps = {
  profileId: string;
  limit?: number;
  showEventDetails?: boolean;
};

export default function ReviewDisplay({ 
  profileId, 
  limit = 5, 
  showEventDetails = true 
}: ReviewDisplayProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    const loadReviews = async () => {
      if (!profileId) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
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
            booking:bookings!reviews_booking_id_fkey(
              event:events!bookings_event_id_fkey(
                title,
                starts_at
              )
            )
          `)
          .eq('reviewee_profile_id', profileId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        const list = (data || []) as unknown as Review[];
        setReviews(list);
        // compute aggregates
        const total = list.length;
        setTotalReviews(total);
        setAverageRating(total > 0 ? list.reduce((sum, r) => sum + r.rating, 0) / total : 0);
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [profileId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAvatarUrl = (profile: any) => {
    if (profile.avatar_url) {
      return profile.avatar_url;
    }
    // Return a placeholder SVG for users without avatars
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="16" fill="#6B7280"/>
        <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">${profile.display_name?.charAt(0)?.toUpperCase() || 'U'}</text>
      </svg>
    `)}`;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (totalReviews === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-xl">⭐</span>
        </div>
        <p className="text-gray-500 text-sm">No reviews yet</p>
      </div>
    );
  }

  return (
    <div>
      {/* Rating Summary */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          {renderStars(Math.round(averageRating))}
          <span className="text-lg font-semibold text-gray-900">
            {averageRating.toFixed(1)}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          {totalReviews} review{totalReviews !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <img
                src={getAvatarUrl(review.reviewer_profile)}
                alt={review.reviewer_profile.display_name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {review.reviewer_profile.display_name}
                    </h4>
                    <p className="text-xs text-gray-500 capitalize">
                      {review.reviewer_profile.role}
                    </p>
                  </div>
                  <div className="text-right">
                    {renderStars(review.rating)}
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                </div>

                {showEventDetails && review.booking?.event && (
                  <div className="mb-2 p-2 bg-gray-50 rounded text-xs">
                    <p className="text-gray-600">
                      <span className="font-medium">Event:</span> {review.booking.event.title}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Date:</span> {formatDate(review.booking.event.starts_at)}
                    </p>
                  </div>
                )}

                {review.comment && (
                  <p className="text-sm text-gray-700 leading-relaxed">
                    "{review.comment}"
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More Link */}
      {totalReviews > limit && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all {totalReviews} reviews
          </button>
        </div>
      )}
    </div>
  );
}
