import { useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import { randomUUID } from 'expo-crypto';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import { syncQueue } from '@/lib/syncQueue';
import { localStore } from '@/lib/localStore';
import { usePhotoStore } from '@/store/usePhotoStore';
import { useStreakStore } from '@/store/useStreakStore';
import { useAnalytics } from './useAnalytics';
import type { Photo } from '@/types';

const PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addPhoto = usePhotoStore((s) => s.addPhoto);
  const incrementStreak = useStreakStore((s) => s.increment);
  const { track } = useAnalytics();

  async function uploadPhoto(
    uri: string,
    userId: string,
    date: string,
    colorId: string,
    stamped = false
  ) {
    setUploading(true);
    setError(null);
    try {
      // Guard: validate source file exists and is within size limit
      const sourceInfo = await FileSystem.getInfoAsync(uri, { size: true });
      if (!sourceInfo.exists) throw new Error('Selected file no longer exists');
      if ((sourceInfo.size ?? 0) > MAX_FILE_SIZE) {
        throw new Error('Photo is too large. Please choose a smaller image.');
      }

      const photoId = randomUUID();
      const localDir = `${PHOTOS_DIR}${userId}/${date}/`;
      const localUri = `${localDir}${photoId}.jpg`;

      // 1. Save to device first — the photo is immediately safe even if offline
      const dirInfo = await FileSystem.getInfoAsync(localDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(localDir, { intermediates: true });
      }
      await FileSystem.copyAsync({ from: uri, to: localUri });

      const photo: Photo = {
        id: photoId,
        user_id: userId,
        date,
        color_id: colorId,
        storage_path: '',
        local_uri: localUri,
        sync_status: 'pending',
        is_private: true,
        created_at: new Date().toISOString(),
        timestamp: stamped,
        url: localUri,
      };

      // 2. Persist locally and update UI immediately
      await localStore.savePhoto(date, photo);
      addPhoto(date, photo);

      // 3. Streak update — runs once per day (idempotent in the store)
      incrementStreak(date);

      // 4. Try cloud upload if online; otherwise queue for later
      const network = await NetInfo.fetch();
      if (network.isConnected) {
        await uploadToCloud(photo, localUri, userId, date, colorId);
      } else {
        await syncQueue.add({
          id: photoId,
          localUri,
          userId,
          date,
          colorId,
          createdAt: photo.created_at,
        });
      }

      track('photo_uploaded', { date });
      return { success: true };
    } catch (e: any) {
      setError(e.message ?? 'Upload failed');
      return { success: false };
    } finally {
      setUploading(false);
    }
  }

  return { uploadPhoto, uploading, error };
}

async function uploadToCloud(
  photo: Photo,
  localUri: string,
  userId: string,
  date: string,
  colorId: string
) {
  try {
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const storagePath = `${userId}/${date}/${photo.id}.jpg`;

    await supabase.storage
      .from('photos')
      .upload(storagePath, decode(base64), { contentType: 'image/jpeg' });

    await supabase.from('photos').insert({
      id: photo.id,
      user_id: userId,
      date,
      color_id: colorId,
      storage_path: storagePath,
      created_at: photo.created_at,
    });

    await localStore.updatePhoto(date, photo.id, {
      sync_status: 'synced',
      storage_path: storagePath,
    });
  } catch {
    // Cloud failed — queue for retry
    await syncQueue.add({
      id: photo.id,
      localUri,
      userId,
      date,
      colorId,
      createdAt: photo.created_at,
    });
  }
}
