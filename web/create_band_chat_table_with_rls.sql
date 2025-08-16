-- Create band_chat_messages table with proper RLS policies
-- This ensures event organizers cannot access band chats at the database level

-- Create the band_chat_messages table
CREATE TABLE IF NOT EXISTS public.band_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_band_chat_messages_band_id ON public.band_chat_messages(band_id);
CREATE INDEX IF NOT EXISTS idx_band_chat_messages_created_at ON public.band_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_band_chat_messages_sender_id ON public.band_chat_messages(sender_id);

-- Enable Row Level Security
ALTER TABLE public.band_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy 1: Only band members can read messages from their bands
-- This automatically excludes organizers since they cannot be band members
DROP POLICY IF EXISTS band_chat_messages_read ON public.band_chat_messages;
CREATE POLICY band_chat_messages_read ON public.band_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.band_members bm
      WHERE bm.band_id = band_chat_messages.band_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('leader', 'member')
    )
  );

-- Policy 2: Only band members can insert messages
DROP POLICY IF EXISTS band_chat_messages_insert ON public.band_chat_messages;
CREATE POLICY band_chat_messages_insert ON public.band_chat_messages
  FOR INSERT WITH CHECK (
    -- Ensure the sender is a member of the band
    EXISTS (
      SELECT 1 FROM public.band_members bm
      WHERE bm.band_id = band_chat_messages.band_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('leader', 'member')
    )
    AND
    -- Ensure the sender_id matches the authenticated user
    sender_id = auth.uid()
  );

-- Policy 3: Only the message sender can update their own messages
DROP POLICY IF EXISTS band_chat_messages_update ON public.band_chat_messages;
CREATE POLICY band_chat_messages_update ON public.band_chat_messages
  FOR UPDATE USING (
    sender_id = auth.uid()
  ) WITH CHECK (
    -- Ensure the sender is still a member of the band
    EXISTS (
      SELECT 1 FROM public.band_members bm
      WHERE bm.band_id = band_chat_messages.band_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('leader', 'member')
    )
    AND
    sender_id = auth.uid()
  );

-- Policy 4: Only the message sender or band leaders can delete messages
DROP POLICY IF EXISTS band_chat_messages_delete ON public.band_chat_messages;
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

-- Grant necessary permissions
GRANT ALL ON public.band_chat_messages TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.band_chat_messages IS 'Messages sent in band chat rooms. Only band members can access these messages.';
COMMENT ON COLUMN public.band_chat_messages.band_id IS 'Reference to the band this message belongs to';
COMMENT ON COLUMN public.band_chat_messages.sender_id IS 'Reference to the user who sent the message';
COMMENT ON COLUMN public.band_chat_messages.sender_name IS 'Display name of the sender at the time of sending';
COMMENT ON COLUMN public.band_chat_messages.content IS 'The message content';
COMMENT ON COLUMN public.band_chat_messages.created_at IS 'Timestamp when the message was created';
