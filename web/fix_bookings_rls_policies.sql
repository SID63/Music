-- Fix RLS policies for bookings table to allow proper application submission and viewing

-- First, check if the additional_requirements column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'additional_requirements'
    ) THEN
        ALTER TABLE bookings ADD COLUMN additional_requirements TEXT;
        COMMENT ON COLUMN bookings.additional_requirements IS 'Additional requirements or notes from the musician for the event';
    END IF;
END $$;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS bookings_insert ON bookings;
DROP POLICY IF EXISTS bookings_select ON bookings;
DROP POLICY IF EXISTS bookings_update ON bookings;
DROP POLICY IF EXISTS bookings_delete ON bookings;

-- Policy 1: Allow musicians to insert applications for themselves
CREATE POLICY bookings_insert ON bookings
  FOR INSERT WITH CHECK (
    musician_profile_id = auth.uid()::text
  );

-- Policy 2: Allow users to view applications for events they own
CREATE POLICY bookings_select ON bookings
  FOR SELECT USING (
    -- Event organizers can see all applications for their events
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = bookings.event_id 
      AND events.organizer_profile_id = auth.uid()::text
    )
    OR
    -- Musicians can see their own applications
    musician_profile_id = auth.uid()::text
  );

-- Policy 3: Allow musicians to update their own applications
CREATE POLICY bookings_update ON bookings
  FOR UPDATE USING (
    musician_profile_id = auth.uid()::text
  );

-- Policy 4: Allow musicians to delete their own applications
CREATE POLICY bookings_delete ON bookings
  FOR DELETE USING (
    musician_profile_id = auth.uid()::text
  );

-- Grant necessary permissions
GRANT ALL ON bookings TO authenticated;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;

-- Show current RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'bookings';
