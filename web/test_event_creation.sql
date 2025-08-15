-- Test script to debug event creation
-- This will help us understand what's preventing event creation

-- First, let's check if we can read from the events table
SELECT 'Can read events' as test, COUNT(*) as count FROM events;

-- Check if we can read from profiles table
SELECT 'Can read profiles' as test, COUNT(*) as count FROM profiles;

-- Check if we can read from bands table  
SELECT 'Can read bands' as test, COUNT(*) as count FROM bands;

-- Check if we can read from band_members table
SELECT 'Can read band_members' as test, COUNT(*) as count FROM band_members;

-- Let's see what profiles exist
SELECT id, display_name, role, user_id FROM profiles LIMIT 5;

-- Let's see what bands exist
SELECT id, name, created_by FROM bands LIMIT 5;

-- Let's see what band members exist
SELECT bm.id, bm.band_id, bm.user_id, bm.role, b.name as band_name 
FROM band_members bm 
JOIN bands b ON bm.band_id = b.id 
LIMIT 5;
