import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Color, Photo } from '@/types';

// ─── Photos ───────────────────────────────────────────────────────────────────

const photoKey = (date: string) => `photos_${date}`;

// Serialize photo writes so concurrent read-modify-write cycles (rapid
// captures, or a capture overlapping a sync update) can't clobber each other.
let writeChain: Promise<unknown> = Promise.resolve();
function runExclusive<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeChain.then(fn, fn);
  // Keep the chain alive regardless of individual failures.
  writeChain = next.then(() => undefined, () => undefined);
  return next;
}

async function getPhotos(date: string): Promise<Photo[]> {
  const raw = await AsyncStorage.getItem(photoKey(date));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return []; // corrupt entry — don't crash the screen
  }
}

function savePhoto(date: string, photo: Photo): Promise<void> {
  return runExclusive(async () => {
    const photos = await getPhotos(date);
    const idx = photos.findIndex((p) => p.id === photo.id);
    if (idx >= 0) photos[idx] = photo;
    else photos.push(photo);
    await AsyncStorage.setItem(photoKey(date), JSON.stringify(photos));
  });
}

function updatePhoto(date: string, id: string, updates: Partial<Photo>): Promise<void> {
  return runExclusive(async () => {
    const photos = await getPhotos(date);
    const idx = photos.findIndex((p) => p.id === id);
    if (idx >= 0) {
      photos[idx] = { ...photos[idx], ...updates };
      await AsyncStorage.setItem(photoKey(date), JSON.stringify(photos));
    }
  });
}

function deletePhoto(date: string, id: string): Promise<void> {
  return runExclusive(async () => {
    const photos = await getPhotos(date);
    await AsyncStorage.setItem(photoKey(date), JSON.stringify(photos.filter((p) => p.id !== id)));
  });
}

// ─── Color cache ──────────────────────────────────────────────────────────────
// Colors never change once assigned, so we cache them indefinitely.

const COLOR_CACHE_KEY = 'color_cache';

async function getColorCache(): Promise<Record<string, Color>> {
  const raw = await AsyncStorage.getItem(COLOR_CACHE_KEY);
  return raw ? JSON.parse(raw) : {};
}

async function cacheColors(colors: Color[]): Promise<void> {
  const existing = await getColorCache();
  const updated = { ...existing, ...Object.fromEntries(colors.map((c) => [c.date, c])) };
  await AsyncStorage.setItem(COLOR_CACHE_KEY, JSON.stringify(updated));
}

async function getCachedColor(date: string): Promise<Color | null> {
  const cache = await getColorCache();
  return cache[date] ?? null;
}

// Batch presence check — one AsyncStorage call instead of N.
async function getPhotosPresenceForDates(dates: string[]): Promise<Set<string>> {
  const keys = dates.map(photoKey);
  const pairs = await AsyncStorage.multiGet(keys);
  const present = new Set<string>();
  for (const [key, val] of pairs) {
    if (!val) continue;
    try {
      if (JSON.parse(val).length > 0) present.add(key.replace('photos_', ''));
    } catch {
      // Corrupt entry — ignore
    }
  }
  return present;
}

export const localStore = {
  getPhotos,
  savePhoto,
  updatePhoto,
  deletePhoto,
  getPhotosPresenceForDates,
  getColorCache,
  cacheColors,
  getCachedColor,
};
