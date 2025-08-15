-- Test if bookings table exists and has the right structure

-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'bookings'
) as table_exists;

-- If table exists, show its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;

-- Check RLS policies
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

-- Test basic access (this should work for authenticated users)
SELECT COUNT(*) as total_bookings FROM bookings;

-- Check if there are any recent bookings
SELECT 
    id,
    event_id,
    musician_profile_id,
    quotation,
    created_at
FROM bookings 
ORDER BY created_at DESC 
LIMIT 5;
