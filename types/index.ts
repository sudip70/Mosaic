export interface Color {
  id: string;
  date: string;
  name: string;
  hex: string;
}

// 'local' = Phase 1 device-only photo (never uploaded). 'pending' | 'synced' |
// 'failed' describe the Phase 2 cloud lifecycle (sharing / backup).
export type SyncStatus = 'local' | 'pending' | 'synced' | 'failed';

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
  timestamp?: boolean;    // was the camera Timestamp setting on at capture? drives the time badge
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

// ─── Mosaic challenges ──────────────────────────────────────────────────────
// A challenge breaks a chosen artwork into N tiles. Each photo paints a stroke:
// its dominant colour fills the unfilled tiles whose target colours match it
// best, so tile count is purely visual detail and every run finishes in about
// the same number of captures (see PHOTOS_PER_MOSAIC). Over the run the user
// rebuilds the painting from colours they found.

// 'active'   — the live run; its tile is today's prompt.
// 'paused'   — set aside but kept whole; can be resumed from where it left off
//              or started over from scratch.
// 'completed'— finished the full run.
// 'abandoned'— legacy status from before set-aside was resumable; treated like
//              'paused' in the UI.
export type ChallengeStatus = 'active' | 'paused' | 'completed' | 'abandoned';
export type TileOrder = 'sequential' | 'random';

// How captures land. 'compass' (default) suggests the colour the painting needs
// most but accepts any photo — every capture paints somewhere. 'hunt' is the
// strict scavenger version: a photo only fills tiles when its colour sits close
// enough to its best remaining match.
export type ChallengeMode = 'compass' | 'hunt';

// One filled tile — keyed by tile index inside Challenge.filled. A photo fills
// a stroke of tiles; each records the dominant colour of the photo behind it.
export interface FilledTile {
  date: string;        // the day it was filled
  hex: string;         // dominant colour of the photo that filled this tile
  photoCount: number;  // photos that contributed (currently always 1)
  uri?: string;        // local file:// path of the photo behind this tile. Only
                       // set on a stroke's anchor tile (the closest colour
                       // match), so the tile viewer shows each photo once; the
                       // rest of the stroke carries the colour only.
}

export interface Challenge {
  id: string;
  artworkId: string;
  artworkTitle: string;
  artworkArtist: string;
  tier: number;                       // nominal tier key (30/60/90/180/365)
  totalTiles: number;                 // actual cols × rows for this artwork's tier
  cols: number;
  rows: number;
  order: TileOrder;
  mode?: ChallengeMode;               // capture rule — absent on older runs, treated as 'compass'
  sequence: number[];                 // fallback fill order — only consumed when
                                      // tier colour data no longer matches
  startDate: string;                  // yyyy-MM-dd
  status: ChallengeStatus;
  filled: Record<number, FilledTile>; // tileIndex → fill
  completedAt?: string;
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
