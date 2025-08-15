-- Create storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for buckets table
-- Allow authenticated users to create buckets
CREATE POLICY "Allow authenticated users to create buckets" ON storage.buckets
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to read buckets
CREATE POLICY "Allow authenticated users to read buckets" ON storage.buckets
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow bucket owners to update buckets
CREATE POLICY "Allow bucket owners to update buckets" ON storage.buckets
FOR UPDATE USING (auth.uid()::text = owner_id);

-- Allow bucket owners to delete buckets
CREATE POLICY "Allow bucket owners to delete buckets" ON storage.buckets
FOR DELETE USING (auth.uid()::text = owner_id);

-- Set up storage policies for avatars bucket
-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = split_part(name, '-', 1)
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = split_part(name, '-', 1)
);

-- Allow public read access to all avatars
CREATE POLICY "Public read access to avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = split_part(name, '-', 1)
);
