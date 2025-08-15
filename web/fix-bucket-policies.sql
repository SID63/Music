-- Fix Bucket Policies Script
-- This script adds only the missing bucket-level policies that are causing RLS errors

-- Drop existing bucket policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to create buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Allow authenticated users to read buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Allow bucket owners to update buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Allow bucket owners to delete buckets" ON storage.buckets;

-- Create the essential bucket policies that allow authenticated users to create buckets
CREATE POLICY "Allow authenticated users to create buckets" ON storage.buckets
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read buckets" ON storage.buckets
FOR SELECT USING (auth.role() = 'authenticated');

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'buckets' AND schemaname = 'storage'
ORDER BY policyname;
