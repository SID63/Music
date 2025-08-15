-- Fix the incomplete bookings table structure

-- Check current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to bookings table';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
    
    -- Add quotation column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'quotation'
    ) THEN
        ALTER TABLE bookings ADD COLUMN quotation DECIMAL(10,2);
        RAISE NOTICE 'Added quotation column to bookings table';
    ELSE
        RAISE NOTICE 'quotation column already exists';
    END IF;
    
    -- Add additional_requirements column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'additional_requirements'
    ) THEN
        ALTER TABLE bookings ADD COLUMN additional_requirements TEXT;
        RAISE NOTICE 'Added additional_requirements column to bookings table';
    ELSE
        RAISE NOTICE 'additional_requirements column already exists';
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN bookings.quotation IS 'The musician''s quote amount in USD';
COMMENT ON COLUMN bookings.additional_requirements IS 'Additional requirements or notes from the musician';
COMMENT ON COLUMN bookings.updated_at IS 'Last update timestamp';

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;

-- Create the trigger
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the final table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;

-- Show any existing data
SELECT COUNT(*) as total_bookings FROM bookings;
SELECT * FROM bookings LIMIT 5;
