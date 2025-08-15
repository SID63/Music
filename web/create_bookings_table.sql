-- Create bookings table if it doesn't exist

-- Check if table exists first
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings'
    ) THEN
        -- Create the bookings table
        CREATE TABLE bookings (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            musician_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            quotation DECIMAL(10,2),
            additional_requirements TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(event_id, musician_profile_id)
        );
        
        -- Add comments
        COMMENT ON TABLE bookings IS 'Stores job applications and quotes from musicians for events';
        COMMENT ON COLUMN bookings.quotation IS 'The musician''s quote amount in USD';
        COMMENT ON COLUMN bookings.additional_requirements IS 'Additional requirements or notes from the musician';
        
        -- Create indexes for better performance
        CREATE INDEX idx_bookings_event_id ON bookings(event_id);
        CREATE INDEX idx_bookings_musician_profile_id ON bookings(musician_profile_id);
        CREATE INDEX idx_bookings_created_at ON bookings(created_at);
        
        RAISE NOTICE 'Bookings table created successfully';
    ELSE
        RAISE NOTICE 'Bookings table already exists';
    END IF;
END $$;

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

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

-- Verify the table was created
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;
