# Mosaic

A daily-colour photo journal. Each day you get one colour; photograph it wherever
you find it, and your captures build into a personal mosaic grid over time.

Built with **Expo (SDK 52) + React Native + TypeScript**, backed by **Supabase**.

---

## Requirements

| Tool | Version |
|---|---|
| Node.js | 18 LTS or newer (20+ recommended) |
| npm | 9+ |
| Expo CLI | use `npx expo` (no global install needed) |
| Xcode | 15+ with an iOS Simulator (for iOS) — macOS only |
| Expo Go | latest, on a physical device (optional alternative) |
| Supabase project | free tier is fine |

> iOS is the primary target. Android should work via Expo but is untested.

---

## Setup

### 1. Install dependencies

```bash
npm install --legacy-peer-deps
```

`--legacy-peer-deps` is required (Expo's peer ranges are stricter than the pinned
versions). A `postinstall` step auto-applies a small patch in `patches/` via
`patch-package` — that's expected.

### 2. Configure environment variables

```bash
cp .env.example .env
```

Then fill in `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
EXPO_PUBLIC_SENTRY_DSN=        # optional — leave blank in dev
EXPO_PUBLIC_POSTHOG_KEY=       # optional — leave blank in dev
```

Get the URL + anon key from your Supabase dashboard → **Settings → API**.
Sentry/PostHog are optional; the app no-ops them when the keys are absent.

### 3. Set up the Supabase backend

In the Supabase dashboard:

1. **Auth → Providers → Anonymous** — enable it.
2. **SQL Editor** — run `supabase/migrations/001_initial_schema.sql` (tables + RLS).
3. **SQL Editor** — run `supabase/seeds/colors.sql` (3 years of daily colours).
   - Regenerate it any time with `node supabase/seed.js`.
4. **Storage** — create a **private** bucket named `photos`, then add a policy
   allowing each user to read/write only their own folder:
   ```sql
   create policy "own photos" on storage.objects for all
     using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);
   ```

See `supabase/DATABASE.md` for the full schema, ERD, and RLS reference.

### 4. Run the app

```bash
npx expo start --ios      # iOS Simulator (macOS + Xcode)
# or
npx expo start            # then scan the QR code with Expo Go on your phone
```

If you change native config or add packages, clear the cache:

```bash
npx expo start --clear
```

---

## Scripts

```bash
npm run ios        # expo start --ios
npm run android    # expo start --android
npm run web        # expo start --web (layout preview only)
npx tsc --noEmit   # type-check
```

---

## Notes for developers

- **Simulator camera:** the iOS Simulator has no camera, so `takePictureAsync`
  returns a black placeholder image with a burned-in timestamp. This is an
  expo-camera/simulator artifact, **not** an app bug — capture works normally on
  a real device.
- **Native modules:** `expo-camera`, `expo-media-library`, `expo-sensors`, and
  `expo-store-review` work in Expo Go for development, but a few features
  (e.g. store review prompts) only fully exercise in a **development build**.
- **Offline-first:** photos are written to the device first, then synced to
  Supabase via a retry queue — the app works without a connection.

---

## Project structure

```
app/                 Screens (Expo Router, file-based)
  (tabs)/            Today, Grid, Friends, Settings
  (auth)/            Phase 2 auth screens (not reachable in Phase 1)
  camera.tsx         Custom camera finder
  day/[date].tsx     Day detail
  photo/[id].tsx     Full-screen photo viewer
  onboarding.tsx     First-launch onboarding
components/ui/       Themed design-system primitives
hooks/               Data + theme hooks
lib/                 Supabase client, theme, storage, helpers
store/               Zustand stores (auth, photos, streak, settings…)
supabase/            Schema migration, colour seed, DATABASE.md
types/               Shared TypeScript types
```
