import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

type ReviewFormProps = {
  revieweeProfileId: string;
  onSuccess?: () => void;
};

export default function ReviewForm({ revieweeProfileId, onSuccess }: ReviewFormProps) {
  const { profile: currentProfile } = useAuth();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [revieweeProfile, setRevieweeProfile] = useState<any>(null);

  useEffect(() => {
    loadRevieweeProfile();
  }, [revieweeProfileId]);

  const loadRevieweeProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, role')
      .eq('id', revieweeProfileId)
      .single();
    
    setRevieweeProfile(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile || rating === 0) return;

    setLoading(true);
    try {
      // Find a completed booking between the current user and the reviewee
      // Use a simpler approach to avoid complex nested queries
      let bookings = null;
      
      // First, try to find bookings where current user is musician and reviewee is organizer
      const { data: bookings1 } = await supabase
        .from('bookings')
        .select('id, event_id, status')
        .in('status', ['completed', 'confirmed'])
        .eq('musician_profile_id', currentProfile.id)
        .limit(1);
      
      if (bookings1 && bookings1.length > 0) {
        // Check if the event organizer is the reviewee
        const { data: event1 } = await supabase
          .from('events')
          .select('organizer_profile_id, starts_at, ends_at')
          .eq('id', bookings1[0].event_id)
          .single();
        
        if (event1 && event1.organizer_profile_id === revieweeProfileId) {
          const booking = bookings1[0];
          const eventEnd = new Date(event1.ends_at || event1.starts_at);
          const eventHasEnded = eventEnd.getTime() <= Date.now();
          if (booking.status === 'completed' || (booking.status === 'confirmed' && eventHasEnded)) {
            bookings = bookings1;
          }
        }
      }
      
      // If not found, try the reverse: reviewee is musician, current user is organizer
      if (!bookings) {
        const { data: bookings2 } = await supabase
          .from('bookings')
          .select('id, event_id, status')
          .in('status', ['completed', 'confirmed'])
          .eq('musician_profile_id', revieweeProfileId)
          .limit(1);
        
        if (bookings2 && bookings2.length > 0) {
          // Check if the event organizer is the current user
          const { data: event2 } = await supabase
            .from('events')
            .select('organizer_profile_id, starts_at, ends_at')
            .eq('id', bookings2[0].event_id)
            .single();
          
          if (event2 && event2.organizer_profile_id === currentProfile.id) {
            const booking = bookings2[0];
            const eventEnd = new Date(event2.ends_at || event2.starts_at);
            const eventHasEnded = eventEnd.getTime() <= Date.now();
            if (booking.status === 'completed' || (booking.status === 'confirmed' && eventHasEnded)) {
              bookings = bookings2;
            }
          }
        }
      }

      if (!bookings || bookings.length === 0) {
        alert('You can only review someone you have worked with on a completed event.');
        return;
      }

      const bookingId = bookings[0].id;

      // Check if review already exists
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('reviewer_profile_id', currentProfile.id)
        .maybeSingle();

      if (existingReview) {
        alert('You have already reviewed this person for this event.');
        return;
      }

      // Insert the review
      const { error } = await supabase
        .from('reviews')
        .insert({
          booking_id: bookingId,
          rating,
          comment: comment.trim() || null,
          reviewer_profile_id: currentProfile.id,
          reviewee_profile_id: revieweeProfileId
        });

      if (error) throw error;

             alert('Review submitted successfully!');
       if (onSuccess) {
         onSuccess();
       } else {
         navigate(`/reviews/${revieweeProfileId}`);
       }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`text-3xl transition-colors ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  if (!revieweeProfile) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Write a Review</h1>
          <p className="text-gray-600">
            Review for {revieweeProfile.display_name} ({revieweeProfile.role})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Rating *
            </label>
            <div className="text-center">
              {renderStars()}
              <p className="text-sm text-gray-500 mt-2">
                {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Click to rate'}
              </p>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              Comment (optional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-foreground placeholder:text-foreground/70 font-medium"
              placeholder="Share your experience working with this person..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
                         <button
               type="button"
               onClick={() => navigate(`/reviews/${revieweeProfileId}`)}
               className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
             >
               Cancel
             </button>
            <button
              type="submit"
              disabled={loading || rating === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
