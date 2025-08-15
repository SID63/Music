-- Fix RLS policies for events and bookings
-- The current policies are missing WITH CHECK conditions for INSERT operations

-- Fix events_insert policy
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

-- Fix bookings_insert policy
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
