# Mosaic - Complete Project Documentation

> A daily color photo app that makes people more observant of their surroundings, and gives them something beautiful to look back on.

---

## Table of Contents

1. [The Idea](#1-the-idea)
2. [Core Philosophy](#2-core-philosophy)
3. [Competitive Landscape](#3-competitive-landscape)
4. [Phased Approach](#4-phased-approach)
   - [Phase 1 - Core Experience](#phase-1--core-experience)
   - [Phase 2 - Social Layer](#phase-2--social-layer)
5. [Design Principles](#5-design-principles)
6. [Tech Stack](#6-tech-stack)
7. [Project Folder Structure](#7-project-folder-structure)
8. [Database Schema](#8-database-schema)
9. [Supabase Storage Structure](#9-supabase-storage-structure)
10. [Key Data Flows](#10-key-data-flows)
11. [Reusable Component System](#11-reusable-component-system)
12. [Custom Hooks](#12-custom-hooks)
13. [Shared Types](#13-shared-types)
14. [Zustand State Stores](#14-zustand-state-stores)
15. [Non-Invasive Logging](#15-non-invasive-logging)
16. [Auth - Phase 2](#16-auth--phase-2)
17. [Getting Started](#17-getting-started)
18. [Settings](#18-settings)
19. [Open Questions](#19-open-questions)

---

## 1. The Idea

Mosaic gives users **one color per day**. Their mission is to photograph that color as many times as they can throughout their day - a red fire hydrant, a friend's red scarf, the ketchup at lunch.

Over time, these photos build into a **personal grid**: a living, colorful diary of how they moved through the world.

**The goal:** make people more observant of their surroundings, and give them something beautiful to look back on.

- One color assigned daily
- Multiple photos captured throughout the day
- Grid profile builds over time - a color calendar of your life
- Tap any day to see that day's full photo collection
- A year = 365 squares - a mosaic of your life through color

---

## 2. Core Philosophy

- **Minimal** - one prompt, one action, no clutter
- **Effortless** - open, see the color, go live your day
- **Non-invasive** - the app lives in the background, not on your screen
- **Private by default** - share only when you want to
- **Calm technology** - the reward is your own archive, not likes or metrics

> The app should almost disappear - it's in the back of your mind, not on your screen.

---

## 3. Competitive Landscape

| App | How It Differs from Mosaic |
|---|---|
| GuruShots | Heavy gamification, leaderboards, competitive voting - performance-focused |
| SnapQuest | Friend competitions, voting system - social pressure baked in |
| ThemeSnap | Daily themes but community rankings and EXIF data focus |
| 52Frames | Weekly challenges, community-driven - less personal diary, more public contest |
| Photo-Challenge App | Generic daily themes, pushes to Instagram - not color-specific |

**The gap:** no app combines a single daily color prompt + multiple captures + a personal mosaic grid + calm, non-competitive social. Mosaic owns that space.

---

## 4. Phased Approach

### Phase 1 - Core Experience

**Goal:** Prove that the daily color loop is enjoyable and habit-forming on its own.

#### The Daily Loop
- A new color is assigned every day at midnight
- User opens the app, sees today's color prominently
- They capture multiple photos throughout the day that include that color
- Photos are saved to that day's color entry

#### The Grid
- Profile screen shows a grid of every day - each square is that day's color
- Tap any square to see all photos captured that day
- Over time the grid becomes a personal color calendar and visual diary
- One year = 365 squares - a mosaic of your life through color

#### Streak Tracking
- A streak counter tracks consecutive days with at least one photo
- Gentle - no aggressive push notifications, no shame for missing a day
- Streaks are personal motivation, not public performance

#### Phase 1 Feature Summary

| Feature | Description |
|---|---|
| Daily Color | One color assigned globally per day, resets at midnight |
| Multi-Photo Capture | Upload or shoot multiple photos per day |
| Day Gallery | Swipeable view of all photos for a given day |
| Color Grid | Full profile grid - color per day, tap to explore |
| Streak Counter | Personal streak tracked locally |
| Anonymous Auth | `signInAnonymously()` on first launch - no credentials, real Supabase session |
| Cloud Storage | Photos stored in Supabase Storage under `{user_id}/{date}/` from day one |
| Single Notification | One gentle morning reminder, opt-in |

#### Phase 1 Success Criteria
- Do users return on their own the next day?
- Does the grid feel rewarding to look at after 2+ weeks?
- Is the photo capture flow truly frictionless (under 3 taps)?

---

### Phase 2 - Social Layer

**Goal:** Let users optionally share their world with a small, trusted circle. Social features are additive - the core experience works without them.

#### Accounts & Identity
- Simple account creation - email or magic link, no password required
- Minimal profile - name, avatar, your grid. Nothing else.

#### Friends
- Add friends by username or invite link - intentional, not algorithmic
- Small circle design - not a follower/following model
- No friend count displayed

#### Sharing
- Private by default - your grid and photos are only yours
- Share a single day's collection with friends selectively
- Or open your whole grid to friends as an ongoing view
- No public profiles - sharing is always within your chosen circle

#### Social Interactions
- No likes, no comment counts, no engagement metrics
- Friends can "notice" a photo - a single quiet reaction, not a popularity score
- The shared color view - see how different people shot the same color on the same day

#### Phase 2 Feature Summary

| Feature | Description |
|---|---|
| Accounts | Email/magic link signup, minimal profile |
| Friend Circles | Add by username or invite, no follower model |
| Privacy Control | Private by default, selectively share days or full grid |
| Friend Grid View | See friends' grids when they choose to share |
| Same-Day Compare | View how friends shot the same color - same day, different lives |
| Notices | Quiet single reaction - not a like, just an acknowledgment |
| No Public Feed | No algorithmic discovery, no strangers |
| Login / Signup Screens | Welcome, login, signup - gated to Phase 2 only |

#### Phase Split Summary

| Feature | Phase 1 | Phase 2 |
|---|---|---|
| Daily color display | ✅ | ✅ |
| Multi-photo capture | ✅ | ✅ |
| Color grid profile | ✅ | ✅ |
| Streak tracking | ✅ | ✅ |
| Anonymous auth (auto, no credentials) | ✅ | ✅ |
| Named account (email / magic link) | - | ✅ |
| Friend circles | - | ✅ |
| Private/share toggle | - | ✅ |
| Friend grid view | - | ✅ |
| Notices (reactions) | - | ✅ |
| Same-day compare view | - | ✅ |
| Login / Signup screens | - | ✅ |

---

## 5. Design Principles

- **The app should almost disappear** - one gentle opt-in morning notification max, no red badges, no endless scroll, no algorithm
- **The grid is the reward** - users return to see their own life taking shape, not external validation
- **Resist feature creep** - no filters, no editing tools, no Stories; if it moves toward Instagram, say no
- **Accessibility matters** - always show color name alongside swatch; consider texture/pattern alternatives for colorblind users

---

## 6. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Mobile Framework | React Native + Expo | iOS first, Android-ready - one codebase |
| Language | TypeScript | Type safety, better DX for solo dev |
| Navigation | Expo Router | File-based routing, clean screen structure |
| State Management | Zustand | Lightweight global state, no Redux overhead |
| Backend & Database | Supabase (Postgres) | Auth, DB, Storage, Edge Functions in one |
| Photo Storage | Supabase Storage (S3) | Per-user photo buckets, day-based structure |
| Camera | expo-image-picker / expo-camera | Native camera + library access |
| Styling | NativeWind (Tailwind for RN) | Utility-first styling, fast iteration |
| Notifications | Expo Notifications | Single daily opt-in morning reminder |
| Date handling | date-fns | Lightweight, no moment.js overhead |
| Error tracking | Sentry | Silent crash and error capture |
| Analytics | PostHog | Behaviour events, no PII, self-hostable |

---

## 7. Project Folder Structure

```
mosaic/
├── app/                        ← All screens (Expo Router)
│   ├── (auth)/                 ← [Phase 2 only]
│   │   ├── _layout.tsx         ← Redirects to tabs if already logged in
│   │   ├── welcome.tsx         ← First launch / intro screen
│   │   ├── login.tsx           ← Email + magic link or password
│   │   └── signup.tsx          ← Create account (minimal - just email)
│   ├── (tabs)/
│   │   ├── index.tsx           ← Today screen (main daily view)
│   │   ├── grid.tsx            ← Your full color grid
│   │   └── friends.tsx         ← Friends & sharing [Phase 2]
│   ├── day/[date].tsx          ← Day detail - all photos for a day
│   ├── camera.tsx              ← Camera / upload screen
│   └── _layout.tsx             ← Root layout, auth guard
│
├── components/
│   ├── ui/                     ← Reusable primitives
│   │   ├── Button.tsx
│   │   ├── ColorSwatch.tsx
│   │   ├── PhotoTile.tsx
│   │   ├── DayTile.tsx
│   │   ├── StreakBadge.tsx
│   │   ├── EmptyState.tsx
│   │   └── Typography.tsx
│   ├── layout/                 ← Structural wrappers
│   │   ├── Screen.tsx          ← Safe area + scroll wrapper
│   │   └── Section.tsx         ← Padded content block
│   └── features/               ← Feature-specific (use ui/ internally)
│       ├── PhotoGrid.tsx
│       ├── DayGallery.tsx
│       └── PhotoCapture.tsx
│
├── hooks/
│   ├── useToday.ts             ← Today's color + date
│   ├── usePhotos.ts            ← Photos for a given date
│   ├── useGrid.ts              ← Full grid data (colors + photo presence)
│   ├── useStreak.ts            ← Current + longest streak
│   ├── useUpload.ts            ← Photo upload with loading/error state
│   ├── useAnalytics.ts         ← Logging wrapper (Sentry + PostHog)
│   └── useAuth.ts              ← Auth state [Phase 2]
│
├── store/
│   ├── useColorStore.ts        ← Today's color, color history
│   ├── usePhotoStore.ts        ← Photos by date, upload state
│   └── useStreakStore.ts       ← Streak count + last active date
│
├── lib/
│   ├── supabase.ts             ← Supabase client init
│   ├── analytics.ts            ← Sentry + PostHog init
│   ├── colors.ts               ← Color palette + daily assignment logic
│   ├── storage.ts              ← Photo upload/download helpers
│   └── dates.ts                ← Date formatting utilities
│
├── types/
│   └── index.ts                ← All TypeScript interfaces
│
├── assets/                     ← Fonts, icons, images
└── supabase/                   ← DB migrations, edge functions
```

---

## 8. Database Schema

### `colors` - Daily color assignments (pre-seeded)

| Column | Type | Description |
|---|---|---|
| id | uuid (PK) | Unique color ID |
| date | date (unique) | The calendar date this color is assigned to |
| name | text | Human-readable name e.g. 'Coral', 'Forest Green' |
| hex | text | Hex code e.g. '#E8735A' |
| created_at | timestamptz | Record creation time |

### `photos` - Every photo a user captures

| Column | Type | Description |
|---|---|---|
| id | uuid (PK) | Unique photo ID |
| user_id | uuid (FK → auth.users) | Owner of the photo |
| date | date | The day this photo belongs to |
| color_id | uuid (FK → colors) | The color assigned on that day |
| storage_path | text | Path in Supabase Storage bucket |
| is_private | boolean (default: true) | Private by default - Phase 2 toggle |
| created_at | timestamptz | Upload timestamp |

### `streaks` - Per-user streak tracking

| Column | Type | Description |
|---|---|---|
| user_id | uuid (PK, FK → auth.users) | One row per user |
| current_streak | integer (default: 0) | Consecutive days with at least 1 photo |
| longest_streak | integer (default: 0) | All-time best streak |
| last_active_date | date | Last date user uploaded a photo |
| updated_at | timestamptz | Last streak update time |

### `friendships` - [Phase 2]

| Column | Type | Description |
|---|---|---|
| id | uuid (PK) | Unique friendship ID |
| requester_id | uuid (FK → auth.users) | User who sent the friend request |
| addressee_id | uuid (FK → auth.users) | User who received the request |
| status | text | 'pending' \| 'accepted' \| 'declined' |
| created_at | timestamptz | When request was sent |

### `notices` - [Phase 2] Quiet reactions

| Column | Type | Description |
|---|---|---|
| id | uuid (PK) | Unique notice ID |
| photo_id | uuid (FK → photos) | Photo that was noticed |
| from_user_id | uuid (FK → auth.users) | Who noticed it |
| created_at | timestamptz | When it happened |

---

## 9. Supabase Storage Structure

```
Bucket: photos
└── {user_id}/
    └── {date}/             ← e.g. 2026-05-31/
        ├── {photo_id}.jpg
        ├── {photo_id}.jpg
        └── {photo_id}.jpg
```

> Row-Level Security on the photos table ensures users can only read/write their own files. Phase 2 sharing is handled by the `is_private` flag.

---

## 10. Key Data Flows

### Daily Color Assignment
1. App opens → reads today's date
2. Query `colors` table `WHERE date = today`
3. Display color name + hex swatch on Today screen
4. Color stored in Zustand for use across camera + grid

### Photo Upload
1. User taps capture → expo-camera or image picker opens
2. Photo uploaded to Supabase Storage at `{user_id}/{date}/{uuid}.jpg`
3. Row inserted into `photos` table with `storage_path` + `color_id`
4. Edge function fires → updates `streaks` table for this user
5. Grid tile for today updates in real-time via Zustand

### Grid Render
1. Query `colors` table for all dates from account creation → today
2. Query `photos` table to find which dates have photos
3. Render grid - each tile shows color hex, filled vs empty state
4. Tap tile → navigate to `day/[date].tsx` → load that day's photos

---

## 11. Reusable Component System

All shared UI lives in `components/ui/`. Screens never define one-off styles - they compose from this library.

### Button

```tsx
// components/ui/Button.tsx
import { Pressable, Text, ActivityIndicator } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;       // default: 'primary'
  loading?: boolean;       // shows spinner, disables press
  disabled?: boolean;
  fullWidth?: boolean;
}

const styles: Record<Variant, string> = {
  primary:   'bg-blue-500 text-white',
  secondary: 'bg-gray-100 text-gray-800',
  ghost:     'bg-transparent text-blue-500',
  danger:    'bg-red-500 text-white',
};

export function Button({ label, onPress, variant = 'primary',
  loading, disabled, fullWidth }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`rounded-xl px-5 py-3 items-center
        ${styles[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {loading
        ? <ActivityIndicator color='white' />
        : <Text className='font-semibold text-base'>{label}</Text>
      }
    </Pressable>
  );
}
```

### ColorSwatch

```tsx
// components/ui/ColorSwatch.tsx
import { View, Text } from 'react-native';

interface ColorSwatchProps {
  hex: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';   // default: 'md'
  showLabel?: boolean;          // default: true
}

const sizes = { sm: 40, md: 80, lg: 140 };

export function ColorSwatch({ hex, name, size = 'md', showLabel = true }: ColorSwatchProps) {
  return (
    <View className='items-center gap-2'>
      <View
        style={{ backgroundColor: hex, width: sizes[size], height: sizes[size] }}
        className='rounded-2xl shadow-sm'
      />
      {showLabel && (
        <Text className='text-sm text-gray-500 font-medium'>{name}</Text>
      )}
    </View>
  );
}
```

### DayTile - The Grid Square

```tsx
// components/ui/DayTile.tsx
import { Pressable, View } from 'react-native';

interface DayTileProps {
  hex: string;              // color for that day
  hasPhotos: boolean;       // filled vs empty state
  isToday: boolean;
  onPress: () => void;
  size?: number;            // default: 40
}

export function DayTile({ hex, hasPhotos, isToday, onPress, size = 40 }: DayTileProps) {
  return (
    <Pressable onPress={onPress}
      style={{ width: size, height: size }}
      className='rounded-md overflow-hidden'
    >
      <View
        style={{ backgroundColor: hasPhotos ? hex : hex + '33' }} // 20% opacity if empty
        className={`flex-1 ${isToday ? 'border-2 border-white' : ''}`}
      />
    </Pressable>
  );
}
```

### Typography

```tsx
// components/ui/Typography.tsx
import { Text, TextProps } from 'react-native';

type Variant = 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';

const variantClasses: Record<Variant, string> = {
  display:  'text-4xl font-bold text-gray-900',
  title:    'text-2xl font-bold text-gray-900',
  subtitle: 'text-lg font-semibold text-gray-700',
  body:     'text-base text-gray-700',
  caption:  'text-sm text-gray-400',
  label:    'text-xs font-semibold uppercase tracking-wide text-gray-500',
};

interface TypographyProps extends TextProps {
  variant?: Variant;
  children: React.ReactNode;
}

export function Typography({ variant = 'body', children, ...rest }: TypographyProps) {
  return (
    <Text className={variantClasses[variant]} {...rest}>{children}</Text>
  );
}
```

---

## 12. Custom Hooks

Screens are dumb - they render. Hooks are smart - they fetch, compute, and manage state.

### useToday

```ts
// hooks/useToday.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import type { Color } from '@/types';

export function useToday() {
  const [color, setColor] = useState<Color | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    async function fetchColor() {
      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .eq('date', today)
        .single();
      if (error) setError(error.message);
      else setColor(data);
      setLoading(false);
    }
    fetchColor();
  }, [today]);

  return { color, loading, error, today };
}
```

### usePhotos

```ts
// hooks/usePhotos.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Photo } from '@/types';

export function usePhotos(date: string, userId: string) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('photos')
        .select('*')
        .eq('date', date)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      setPhotos(data ?? []);
      setLoading(false);
    }
    fetch();
  }, [date, userId]);

  return { photos, loading };
}
```

### useUpload

```ts
// hooks/useUpload.ts
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAnalytics } from './useAnalytics';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { track } = useAnalytics();

  async function uploadPhoto(uri: string, userId: string, date: string, colorId: string) {
    setUploading(true);
    setError(null);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const photoId = crypto.randomUUID();
      const path = `${userId}/${date}/${photoId}.jpg`;

      await supabase.storage.from('photos').upload(path, decode(base64),
        { contentType: 'image/jpeg' }
      );

      await supabase.from('photos').insert({
        id: photoId, user_id: userId, date,
        color_id: colorId, storage_path: path,
      });

      track('photo_uploaded', { date }); // non-invasive log
      return { success: true };
    } catch (e: any) {
      setError(e.message);
      return { success: false };
    } finally {
      setUploading(false);
    }
  }

  return { uploadPhoto, uploading, error };
}
```

### useGrid

```ts
// hooks/useGrid.ts
// Returns every day from user's start date → today,
// merged with which days have photos. Powers the grid screen.
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { eachDayOfInterval, parseISO, format } from 'date-fns';
import type { GridDay } from '@/types';

export function useGrid(userId: string, startDate: string) {
  const [days, setDays] = useState<GridDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function build() {
      const today = format(new Date(), 'yyyy-MM-dd');
      const allDates = eachDayOfInterval({
        start: parseISO(startDate), end: parseISO(today),
      }).map(d => format(d, 'yyyy-MM-dd'));

      const [{ data: colors }, { data: photos }] = await Promise.all([
        supabase.from('colors').select('date,hex,name').in('date', allDates),
        supabase.from('photos').select('date').eq('user_id', userId),
      ]);

      const datesWithPhotos = new Set(photos?.map(p => p.date) ?? []);
      const colorMap = Object.fromEntries((colors ?? []).map(c => [c.date, c]));

      setDays(allDates.map(date => ({
        date,
        hex: colorMap[date]?.hex ?? '#CCCCCC',
        name: colorMap[date]?.name ?? '',
        hasPhotos: datesWithPhotos.has(date),
        isToday: date === today,
      })));
      setLoading(false);
    }
    build();
  }, [userId, startDate]);

  return { days, loading };
}
```

---

## 13. Shared Types

```ts
// types/index.ts

export interface Color {
  id: string;
  date: string;         // 'yyyy-MM-dd'
  name: string;         // e.g. 'Coral'
  hex: string;          // e.g. '#E8735A'
}

export interface Photo {
  id: string;
  user_id: string;
  date: string;
  color_id: string;
  storage_path: string;
  is_private: boolean;
  created_at: string;
  url?: string;         // resolved at render time
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
```

---

## 14. Zustand State Stores

### usePhotoStore

```ts
// store/usePhotoStore.ts
import { create } from 'zustand';
import type { Photo } from '@/types';

interface PhotoStore {
  photosByDate: Record<string, Photo[]>;
  addPhoto: (date: string, photo: Photo) => void;
  setPhotos: (date: string, photos: Photo[]) => void;
}

export const usePhotoStore = create<PhotoStore>((set) => ({
  photosByDate: {},

  addPhoto: (date, photo) => set(state => ({
    photosByDate: {
      ...state.photosByDate,
      [date]: [...(state.photosByDate[date] ?? []), photo],
    }
  })),

  setPhotos: (date, photos) => set(state => ({
    photosByDate: { ...state.photosByDate, [date]: photos }
  })),
}));
```

### useStreakStore

```ts
// store/useStreakStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StreakStore {
  current: number;
  longest: number;
  lastActiveDate: string | null;
  increment: () => void;
  reset: () => void;
}

// persist keeps streak alive between app restarts
export const useStreakStore = create<StreakStore>()(
  persist(
    (set, get) => ({
      current: 0,
      longest: 0,
      lastActiveDate: null,

      increment: () => set(state => {
        const next = state.current + 1;
        return { current: next, longest: Math.max(next, state.longest) };
      }),

      reset: () => set({ current: 0 }),
    }),
    { name: 'streak', storage: createJSONStorage(() => AsyncStorage) }
  )
);
```

---

## 15. Non-Invasive Logging

Two tools. One wrapper. Screens never call Sentry or PostHog directly.

| Tool | Purpose | Data Collected | User Impact |
|---|---|---|---|
| Sentry | Crash & error tracking | Stack traces, device OS, app version - no PII | Zero - silent background capture |
| PostHog | Behaviour analytics | Named events + anonymous ID - no PII, no photos | Zero - fire-and-forget events |

### What Gets Tracked

| Event | Trigger | Properties |
|---|---|---|
| `app_opened` | App comes to foreground | None |
| `screen_viewed` | Screen mounts | screen_name |
| `photo_uploaded` | Successful upload | date (no content, no path) |
| `day_viewed` | User taps a grid tile | date |
| `streak_milestone` | Streak hits 7, 30, 100 | streak_count |
| `error_occurred` | Caught exception | error_type (Sentry handles detail) |

> **Never logged:** photo content, storage paths, user identity, PII, friends list, or any private data.

### Install

```bash
npm install @sentry/react-native posthog-react-native
npx @sentry/wizard -i reactNative     # auto-configures Sentry
```

### lib/analytics.ts

```ts
// lib/analytics.ts
import * as Sentry from '@sentry/react-native';
import PostHog from 'posthog-react-native';

export function initAnalytics() {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.2,       // sample 20% of transactions
    enableNativeNagger: false,   // no console noise in dev
  });
}

export const posthog = new PostHog(
  process.env.EXPO_PUBLIC_POSTHOG_KEY!,
  {
    host: 'https://app.posthog.com',
    // Or self-host: 'https://your-posthog.com'
    disabled: __DEV__,           // no tracking in development
  }
);
```

### hooks/useAnalytics.ts - The Single Wrapper

```ts
// hooks/useAnalytics.ts
// The ONLY file that imports Sentry or PostHog.
// All screens and hooks call this - never the tools directly.
import * as Sentry from '@sentry/react-native';
import { posthog } from '@/lib/analytics';

type EventName =
  | 'app_opened'
  | 'screen_viewed'
  | 'photo_uploaded'
  | 'day_viewed'
  | 'streak_milestone'
  | 'error_occurred';

type EventProperties = Record<string, string | number | boolean>;

export function useAnalytics() {

  // Track a named event with optional properties
  function track(event: EventName, properties?: EventProperties) {
    posthog.capture(event, properties);
  }

  // Capture an error - goes to Sentry with full context
  function captureError(error: Error, context?: Record<string, string>) {
    Sentry.withScope(scope => {
      if (context) scope.setExtras(context);
      Sentry.captureException(error);
    });
  }

  // Use in screens that want to log when they mount
  function trackScreen(name: string) {
    track('screen_viewed', { screen_name: name });
  }

  return { track, captureError, trackScreen };
}
```

### Usage in a Screen

```tsx
// app/(tabs)/index.tsx - Today screen
import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useToday } from '@/hooks/useToday';

export default function TodayScreen() {
  const { color, loading } = useToday();
  const { trackScreen } = useAnalytics();

  useEffect(() => {
    trackScreen('today');   // one line, that's it
  }, []);

  // ... rest of screen
}
```

---

## 16. Auth - Phase 2

> Named accounts are excluded from Phase 1, but Supabase anonymous auth runs from first launch. The core loop (color → capture → grid → streak) is fully cloud-backed with no credentials required.

Supabase Auth provides:
- **Anonymous sign-in** - `signInAnonymously()` on first launch, no email needed
- **Magic link upgrade** - Phase 2 links email to the existing anonymous session via `linkIdentity()`
- **Session management** - handled automatically, persists across restarts
- **Row-Level Security** - `auth.uid()` used directly in DB policies from day one

### hooks/useAuth.ts

```ts
// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        setSession(data.session);
        setLoading(false);
      } else {
        // Phase 1: auto sign-in anonymously - no credentials, real session
        const { data: anonData } = await supabase.auth.signInAnonymously();
        setSession(anonData.session);
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Phase 2: links email to the existing anonymous session (no data migration needed)
  async function signInWithMagicLink(email: string) {
    return supabase.auth.signInWithOtp({ email });
  }

  async function signOut() {
    return supabase.auth.signOut();
  }

  return {
    session,
    user: session?.user ?? null,
    isAnonymous: session?.user?.is_anonymous ?? true,
    loading,
    signInWithMagicLink,
    signOut,
  };
}
```

### Auth Guard in Root Layout

```tsx
// app/_layout.tsx
import { useAuth } from '@/hooks/useAuth';
import { Redirect, Stack } from 'expo-router';

export default function RootLayout() {
  const { session, loading } = useAuth();

  if (loading) return null;  // or a splash screen

  // Phase 1: no auth needed, go straight to tabs
  // Phase 2: uncomment the redirect below
  // if (!session) return <Redirect href='/(auth)/welcome' />;

  return <Stack />;
}
```

> The auth guard is a single commented line in Phase 1. Uncomment it for Phase 2. No other files change.

---

## 17. Getting Started

### 1. Bootstrap the project

```bash
npx create-expo-app mosaic --template blank-typescript
cd mosaic
```

### 2. Install core dependencies

```bash
npx expo install expo-router expo-camera expo-image-picker
npx expo install expo-notifications expo-file-system
npm install @supabase/supabase-js zustand date-fns
npm install nativewind && npm install -D tailwindcss
```

### 3. Install logging dependencies

```bash
npm install @sentry/react-native posthog-react-native
npx @sentry/wizard -i reactNative
```

### 4. Set up Supabase

```bash
# Create project at supabase.com
# Copy your URL + anon key into lib/supabase.ts
# Run the SQL schema in the Supabase SQL editor
```

### 5. Environment variables

```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
EXPO_PUBLIC_POSTHOG_KEY=your_posthog_key
```

### 6. Run on iOS simulator

```bash
npx expo start --ios
```

> **Phase 1 auth strategy:** Call `supabase.auth.signInAnonymously()` on first launch. Supabase creates a real session with a UUID - no credentials required. Photos, grid, and streaks all use this `user_id` from day one. When the user creates an account in Phase 2, they link their email to the same anonymous user and nothing migrates.

---

## 18. Settings

Settings are split by auth state. Phase 1 users (anonymous) see local-only controls. Phase 2 users (named account) unlock identity and social settings.

### Phase 1 - No Account, Local Only

| Setting | Options / Controls |
|---|---|
| Notifications | Morning reminder toggle + time picker |
| Appearance | Light / Dark / System |
| Grid view | Compact / Comfortable |
| Storage | Cache size display + clear cache action |
| About | App version, "What is Mosaic?" explainer, Share app |

### Phase 2 - Unlocked with Account

| Setting | Options / Controls |
|---|---|
| Profile | Display name, avatar, username |
| Privacy | Who can see your grid (only me / friends) |
| Account | Sign out, delete account |
| Friends & Sharing | Default sharing preference, manage friend list |

> Phase 2 settings appear below a visible divider in the settings screen. Anonymous users see them greyed out with a prompt to create an account, or they are hidden entirely - TBD.

---

## 19. Open Questions

- **App name** - working title is Mosaic
- **Color selection** - curated human palette or algorithmically generated?
- **Streak leniency** - grace period for missed days? Freeze tokens?
- **Grid shape** - square grid or calendar layout (month view)?
- **Colorblind accessibility** - alternative prompt system needed
- **Color palette size** - how many unique colors before repeating?

---

*Mosaic - Complete Project Documentation · Phase 1 & 2 · Draft*
