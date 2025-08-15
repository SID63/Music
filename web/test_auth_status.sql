-- Test authentication status and user context
-- This will help us understand if the user is properly authenticated

-- Check if we can access user information
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role,
  auth.email() as current_email;

-- Check if we can read from profiles table (this should work if authenticated)
SELECT COUNT(*) as profiles_count FROM profiles;

-- Check if we can read from events table
SELECT COUNT(*) as events_count FROM events;

-- Check if we can read from bands table
SELECT COUNT(*) as bands_count FROM bands;

-- Check if we can read from band_members table
SELECT COUNT(*) as band_members_count FROM band_members;
