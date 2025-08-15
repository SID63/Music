-- Add status column to bookings table
ALTER TABLE bookings 
ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'confirmed', 'cancelled'));

-- Add index for better performance
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_musician_status ON bookings(musician_profile_id, status);
