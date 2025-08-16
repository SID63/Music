-- Fix band_chat_messages table column mismatch
-- The existing table has 'message' column but frontend expects 'content'

-- First, let's check the current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'band_chat_messages' 
ORDER BY ordinal_position;

-- Rename 'message' column to 'content' to match frontend expectations
ALTER TABLE public.band_chat_messages 
RENAME COLUMN message TO content;

-- Add comment to the renamed column
COMMENT ON COLUMN public.band_chat_messages.content IS 'The message content';

-- Verify the change
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'band_chat_messages' 
ORDER BY ordinal_position;

-- Check if RLS policies exist and are working
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
WHERE tablename = 'band_chat_messages';

-- If no RLS policies exist, create them
DO $$
BEGIN
    -- Check if policies exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'band_chat_messages' 
        AND policyname = 'band_chat_messages_read'
    ) THEN
        -- Create RLS policies
        CREATE POLICY band_chat_messages_read ON public.band_chat_messages
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.band_members bm
              WHERE bm.band_id = band_chat_messages.band_id
              AND bm.user_id = auth.uid()
              AND bm.role IN ('leader', 'member')
            )
          );

        CREATE POLICY band_chat_messages_insert ON public.band_chat_messages
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.band_members bm
              WHERE bm.band_id = band_chat_messages.band_id
              AND bm.user_id = auth.uid()
              AND bm.role IN ('leader', 'member')
            )
            AND sender_id = auth.uid()
          );

        CREATE POLICY band_chat_messages_update ON public.band_chat_messages
          FOR UPDATE USING (
            sender_id = auth.uid()
          ) WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.band_members bm
              WHERE bm.band_id = band_chat_messages.band_id
              AND bm.user_id = auth.uid()
              AND bm.role IN ('leader', 'member')
            )
            AND sender_id = auth.uid()
          );

        CREATE POLICY band_chat_messages_delete ON public.band_chat_messages
          FOR DELETE USING (
            sender_id = auth.uid()
            OR
            EXISTS (
              SELECT 1 FROM public.band_members bm
              WHERE bm.band_id = band_chat_messages.band_id
              AND bm.user_id = auth.uid()
              AND bm.role = 'leader'
            )
          );

        RAISE NOTICE 'RLS policies created for band_chat_messages table';
    ELSE
        RAISE NOTICE 'RLS policies already exist for band_chat_messages table';
    END IF;
END $$;

-- Final verification
SELECT 'band_chat_messages table fixed successfully' as status;
