-- Fix Events RLS Policy and Add Missing Fields
-- This migration allows both organizers and musicians to post events

-- First, add the missing columns to the events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS event_type text DEFAULT 'gig',
ADD COLUMN IF NOT EXISTS genres text[],
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS requirements text,
ADD COLUMN IF NOT EXISTS equipment_provided text,
ADD COLUMN IF NOT EXISTS parking_info text,
ADD COLUMN IF NOT EXISTS additional_notes text;

-- Update the RLS policy to allow both organizers and musicians to create events
DROP POLICY IF EXISTS events_insert ON public.events;
CREATE POLICY events_insert ON public.events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = organizer_profile_id
        AND p.user_id = auth.uid()
        AND (p.role = 'organizer' OR p.role = 'musician')
    )
  );

-- Update the RLS policy to allow both organizers and musicians to update their events
DROP POLICY IF EXISTS events_update ON public.events;
CREATE POLICY events_update ON public.events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = organizer_profile_id AND p.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = organizer_profile_id AND p.user_id = auth.uid()
    )
  );

-- Update the RLS policy to allow both organizers and musicians to delete their events
DROP POLICY IF EXISTS events_delete ON public.events;
CREATE POLICY events_delete ON public.events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = organizer_profile_id AND p.user_id = auth.uid()
    )
  );

-- Add constraints for data validation
ALTER TABLE public.events 
ADD CONSTRAINT events_budget_check 
  CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_min <= budget_max),
ADD CONSTRAINT events_date_check 
  CHECK (ends_at IS NULL OR starts_at <= ends_at),
ADD CONSTRAINT events_event_type_check 
  CHECK (event_type IN ('gig', 'wedding', 'corporate', 'festival', 'party', 'ceremony', 'other'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS events_event_type_idx ON public.events (event_type);
CREATE INDEX IF NOT EXISTS events_genres_idx ON public.events USING GIN (genres);
CREATE INDEX IF NOT EXISTS events_budget_range_idx ON public.events (budget_min, budget_max);

-- Grant necessary permissions
GRANT ALL ON public.events TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
