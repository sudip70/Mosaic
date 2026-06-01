export interface Color {
  id: string;
  date: string;
  name: string;
  hex: string;
}

export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface Photo {
  id: string;
  user_id: string;
  date: string;
  color_id: string;
  storage_path: string;   // Supabase path — empty until synced
  local_uri?: string;     // file:// path on device — always set
  sync_status: SyncStatus;
  is_private: boolean;
  created_at: string;
  url?: string;           // resolved at render: local_uri if pending, Supabase URL if synced
}

export interface GridDay {
  date: string;
  hex: string;
  name: string;
  hasPhotos: boolean;
  isToday: boolean;
}

export interface Streak {
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
}

// Phase 2
export interface User {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined';
}
