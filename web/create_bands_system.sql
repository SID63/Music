-- Create bands table
CREATE TABLE IF NOT EXISTS bands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create band_members table for many-to-many relationship
CREATE TABLE IF NOT EXISTS band_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(100) NOT NULL DEFAULT 'member', -- 'leader', 'member', 'pending'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(band_id, user_id)
);

-- Create band_requests table for join requests
CREATE TABLE IF NOT EXISTS band_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL, -- 'musician_to_band', 'band_to_musician'
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for bands table
ALTER TABLE bands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all active bands" ON bands
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create bands" ON bands
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Band leaders can update their bands" ON bands
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM band_members 
      WHERE band_id = bands.id 
      AND user_id = auth.uid() 
      AND role = 'leader'
    )
  );

CREATE POLICY "Band leaders can delete their bands" ON bands
  FOR DELETE USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM band_members 
      WHERE band_id = bands.id 
      AND user_id = auth.uid() 
      AND role = 'leader'
    )
  );

-- Add RLS policies for band_members table
ALTER TABLE band_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view band members" ON band_members
  FOR SELECT USING (true);

CREATE POLICY "Band leaders can add members" ON band_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM band_members 
      WHERE band_id = band_members.band_id 
      AND user_id = auth.uid() 
      AND role = 'leader'
    )
  );

CREATE POLICY "Band leaders can update members" ON band_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM band_members 
      WHERE band_id = band_members.band_id 
      AND user_id = auth.uid() 
      AND role = 'leader'
    )
  );

CREATE POLICY "Users can leave bands" ON band_members
  FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for band_requests table
ALTER TABLE band_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests" ON band_requests
  FOR SELECT USING (
    auth.uid() = requester_id OR
    EXISTS (
      SELECT 1 FROM band_members 
      WHERE band_id = band_requests.band_id 
      AND user_id = auth.uid() 
      AND role = 'leader'
    )
  );

CREATE POLICY "Users can create requests" ON band_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Band leaders can update requests" ON band_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM band_members 
      WHERE band_id = band_requests.band_id 
      AND user_id = auth.uid() 
      AND role = 'leader'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_band_members_band_id ON band_members(band_id);
CREATE INDEX IF NOT EXISTS idx_band_members_user_id ON band_members(user_id);
CREATE INDEX IF NOT EXISTS idx_band_requests_band_id ON band_requests(band_id);
CREATE INDEX IF NOT EXISTS idx_band_requests_requester_id ON band_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_band_requests_status ON band_requests(status);
