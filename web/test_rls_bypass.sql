-- Test to temporarily disable RLS and see if event creation works
-- This will help us determine if the issue is with RLS or the data structure

-- Temporarily disable RLS on events table
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Try to insert a test event
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
  '59344a53-55ec-49a1-9764-1d03df276c92', -- hsh's profile ID (musician)
  'Test Event - RLS Bypass',
  'This is a test event with RLS disabled',
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

-- Re-enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Show the created event
SELECT id, title, organizer_profile_id, posted_by_type, created_at FROM events WHERE title = 'Test Event - RLS Bypass';
