-- Add quotation field to bookings table
-- This allows musicians to include their price when applying for jobs

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS quotation integer;

-- Add comment to explain the field
COMMENT ON COLUMN public.bookings.quotation IS 'Musician''s quoted price for this specific event (in dollars)';

-- Add constraint to ensure quotation is positive if provided
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_quotation_check 
  CHECK (quotation IS NULL OR quotation > 0);
