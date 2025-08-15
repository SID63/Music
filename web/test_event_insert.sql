-- Test event insertion with RLS policies
-- This will help us understand if the issue is with RLS or the frontend

-- First, let's check the current user context
SELECT auth.uid() as current_user_id;

-- Let's try to insert a test event (this will fail if RLS blocks it)
-- We'll use one of the existing profile IDs
INSERT INTO events (
  organizer_profile_id,
  title,
  description,
  location,
  event_type,
  genres,
  starts_at,
  ends_at,
  budget_min,
  budget_max,
  contact_email,
  contact_phone,
  requirements,
  equipment_provided,
  parking_info,
  additional_notes,
  posted_by_type
) VALUES (
  'aab4c07e-1cc3-4efd-b94d-ff29863ca7d8', -- SID's profile ID (organizer)
  'Test Event',
  'This is a test event to verify RLS policies',
  'Test Location',
  'gig',
  ARRAY['rock', 'pop'],
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '2 days',
  100,
  500,
  'test@example.com',
  '123-456-7890',
  'Test requirements',
  'Test equipment',
  'Test parking',
  'Test notes',
  'individual'
);

-- Check if the event was created
SELECT COUNT(*) as events_after_insert FROM events;
