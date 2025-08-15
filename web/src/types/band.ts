export type Band = {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  member_count?: number;
  members?: BandMember[];
};

export type BandMember = {
  id: string;
  band_id: string;
  user_id: string;
  role: 'leader' | 'member' | 'pending';
  joined_at: string;
  user?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

export type BandRequest = {
  id: string;
  band_id: string;
  requester_id: string;
  request_type: 'musician_to_band' | 'band_to_musician';
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;
  created_at: string;
  updated_at: string;
  band?: Band;
  requester?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};
