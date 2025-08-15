-- Add extension fields to messages table
-- This migration adds the missing columns needed for enhanced messaging with event context

-- Add the missing columns to the messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS topic text,
ADD COLUMN IF NOT EXISTS extension text,
ADD COLUMN IF NOT EXISTS event text,
ADD COLUMN IF NOT EXISTS payload jsonb;

-- Add comments to explain the new fields
COMMENT ON COLUMN public.messages.topic IS 'Message topic/subject for better organization';
COMMENT ON COLUMN public.messages.extension IS 'Message type extension (e.g., event_inquiry, job_application, general)';
COMMENT ON COLUMN public.messages.event IS 'Event ID if message is related to a specific event';
COMMENT ON COLUMN public.messages.payload IS 'Additional structured data for the message (JSON format)';

-- Add constraints for data validation
ALTER TABLE public.messages 
ADD CONSTRAINT messages_extension_check 
  CHECK (extension IN ('event_inquiry', 'job_application', 'general') OR extension IS NULL);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS messages_extension_idx ON public.messages (extension);
CREATE INDEX IF NOT EXISTS messages_event_idx ON public.messages (event);
CREATE INDEX IF NOT EXISTS messages_topic_idx ON public.messages (topic);

-- Grant necessary permissions
GRANT ALL ON public.messages TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
