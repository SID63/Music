-- Complete Storage Policy Fix
-- This script fixes both bucket and object policies to work with the current filename format

-- First, ensure the avatars bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to create buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Allow authenticated users to read buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Allow bucket owners to update buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Allow bucket owners to delete buckets" ON storage.buckets;

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create bucket policies
CREATE POLICY "Allow authenticated users to create buckets" ON storage.buckets
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read buckets" ON storage.buckets
FOR SELECT USING (auth.role() = 'authenticated');

-- Create object policies with fixed filename matching
-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

-- Allow users to update their own avatar (by filename pattern)
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  (
    -- Match filename starting with user ID
    name LIKE auth.uid()::text || '-%' OR
    -- Match filename starting with 'test-' + user ID
    name LIKE 'test-' || auth.uid()::text || '%'
  )
);

-- Allow public read access to all avatars
CREATE POLICY "Public read access to avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to delete their own avatar (by filename pattern)
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND 
  (
    -- Match filename starting with user ID
    name LIKE auth.uid()::text || '-%' OR
    -- Match filename starting with 'test-' + user ID
    name LIKE 'test-' || auth.uid()::text || '%'
  )
);

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE (tablename = 'buckets' OR tablename = 'objects') AND schemaname = 'storage'
ORDER BY tablename, policyname;
