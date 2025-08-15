-- Add additional_requirements column to bookings table
ALTER TABLE bookings 
ADD COLUMN additional_requirements TEXT;

-- Add comment for documentation
COMMENT ON COLUMN bookings.additional_requirements IS 'Additional requirements or notes from the musician for the event';

-- Update RLS policy to allow musicians to update their own applications
DROP POLICY IF EXISTS bookings_update ON bookings;
CREATE POLICY bookings_update ON bookings
  FOR UPDATE USING (
    musician_profile_id = auth.uid()::text
  );

-- Allow musicians to update their own applications
GRANT UPDATE ON bookings TO authenticated;
