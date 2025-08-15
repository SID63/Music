-- Add band support to events and bookings tables
-- This allows bands to post events and accept events

-- Add band_id column to events table to track if event is posted by a band
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS band_id uuid REFERENCES public.bands(id),
ADD COLUMN IF NOT EXISTS posted_by_type text DEFAULT 'individual' CHECK (posted_by_type IN ('individual', 'band'));

-- Add band_id column to bookings table to track if booking is made by a band
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS band_id uuid REFERENCES public.bands(id),
ADD COLUMN IF NOT EXISTS applied_by_type text DEFAULT 'individual' CHECK (applied_by_type IN ('individual', 'band'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS events_band_id_idx ON public.events (band_id);
CREATE INDEX IF NOT EXISTS bookings_band_id_idx ON public.bookings (band_id);
CREATE INDEX IF NOT EXISTS events_posted_by_type_idx ON public.events (posted_by_type);
CREATE INDEX IF NOT EXISTS bookings_applied_by_type_idx ON public.bookings (applied_by_type);

-- Add comments for documentation
COMMENT ON COLUMN public.events.band_id IS 'ID of the band that posted this event (if posted by a band)';
COMMENT ON COLUMN public.events.posted_by_type IS 'Whether this event was posted by an individual or a band';
COMMENT ON COLUMN public.bookings.band_id IS 'ID of the band that applied for this event (if applied by a band)';
COMMENT ON COLUMN public.bookings.applied_by_type IS 'Whether this booking was made by an individual or a band';

-- Update RLS policies to allow band leaders to manage their band's events and bookings

-- Allow band leaders to create events for their bands
DROP POLICY IF EXISTS events_insert ON public.events;
CREATE POLICY events_insert ON public.events
  FOR INSERT WITH CHECK (
    -- Individual organizers/musicians can create events
    (posted_by_type = 'individual' AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = organizer_profile_id
        AND p.user_id = auth.uid()
        AND (p.role = 'organizer' OR p.role = 'musician')
    ))
    OR
    -- Band leaders can create events for their bands
    (posted_by_type = 'band' AND band_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.band_members bm
      WHERE bm.band_id = events.band_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'leader'
    ))
  );

-- Allow band leaders to update events for their bands
DROP POLICY IF EXISTS events_update ON public.events;
CREATE POLICY events_update ON public.events
  FOR UPDATE USING (
    -- Individual organizers can update their events
    (posted_by_type = 'individual' AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = organizer_profile_id AND p.user_id = auth.uid()
    ))
    OR
    -- Band leaders can update events for their bands
    (posted_by_type = 'band' AND band_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.band_members bm
      WHERE bm.band_id = events.band_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'leader'
    ))
  ) WITH CHECK (
    -- Same conditions for WITH CHECK
    (posted_by_type = 'individual' AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = organizer_profile_id AND p.user_id = auth.uid()
    ))
    OR
    (posted_by_type = 'band' AND band_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.band_members bm
      WHERE bm.band_id = events.band_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'leader'
    ))
  );

-- Allow band leaders to delete events for their bands
DROP POLICY IF EXISTS events_delete ON public.events;
CREATE POLICY events_delete ON public.events
  FOR DELETE USING (
    -- Individual organizers can delete their events
    (posted_by_type = 'individual' AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = organizer_profile_id AND p.user_id = auth.uid()
    ))
    OR
    -- Band leaders can delete events for their bands
    (posted_by_type = 'band' AND band_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.band_members bm
      WHERE bm.band_id = events.band_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'leader'
    ))
  );

-- Allow band leaders to view events posted by their bands
DROP POLICY IF EXISTS events_read ON public.events;
CREATE POLICY events_read ON public.events
  FOR SELECT USING (
    -- Public read access for all events
    true
  );

-- Update bookings policies to support bands

-- Allow band leaders to create bookings for their bands
DROP POLICY IF EXISTS bookings_insert ON public.bookings;
CREATE POLICY bookings_insert ON public.bookings
  FOR INSERT WITH CHECK (
    -- Individual musicians can create bookings for themselves
    (applied_by_type = 'individual' AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = musician_profile_id AND p.user_id = auth.uid()
    ))
    OR
    -- Band leaders can create bookings for their bands
    (applied_by_type = 'band' AND band_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.band_members bm
      WHERE bm.band_id = bookings.band_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'leader'
    ))
  );

-- Allow band leaders to view bookings for events their bands posted
DROP POLICY IF EXISTS bookings_read ON public.bookings;
CREATE POLICY bookings_read ON public.bookings
  FOR SELECT USING (
    -- Event organizers can see all applications for their events
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = bookings.event_id 
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = events.organizer_profile_id AND p.user_id = auth.uid()
      )
    )
    OR
    -- Band leaders can see applications for events their bands posted
    EXISTS (
      SELECT 1 FROM events e
      JOIN band_members bm ON bm.band_id = e.band_id
      WHERE e.id = bookings.event_id 
      AND bm.user_id = auth.uid()
      AND bm.role = 'leader'
      AND e.posted_by_type = 'band'
    )
    OR
    -- Individual musicians can see their own applications
    (applied_by_type = 'individual' AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = musician_profile_id AND p.user_id = auth.uid()
    ))
    OR
    -- Band leaders can see applications made by their bands
    (applied_by_type = 'band' AND band_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.band_members bm
      WHERE bm.band_id = bookings.band_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'leader'
    ))
  );

-- Allow band leaders to update bookings made by their bands
DROP POLICY IF EXISTS bookings_update ON public.bookings;
CREATE POLICY bookings_update ON public.bookings
  FOR UPDATE USING (
    -- Individual musicians can update their own applications
    (applied_by_type = 'individual' AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = musician_profile_id AND p.user_id = auth.uid()
    ))
    OR
    -- Band leaders can update applications made by their bands
    (applied_by_type = 'band' AND band_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.band_members bm
      WHERE bm.band_id = bookings.band_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'leader'
    ))
  );
