import { useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { randomUUID } from 'expo-crypto';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import { syncQueue } from '@/lib/syncQueue';
import { localStore } from '@/lib/localStore';
import { reportError } from '@/lib/reportError';
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

      const compressedUri = await compressPhoto(uri);

      const photoId = randomUUID();
      const localDir = `${PHOTOS_DIR}${userId}/${date}/`;
      const localUri = `${localDir}${photoId}.webp`;

      // 1. Save to device first — the photo is immediately safe even if offline
      const dirInfo = await FileSystem.getInfoAsync(localDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(localDir, { intermediates: true });
      }
      await FileSystem.copyAsync({ from: compressedUri, to: localUri });

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
      reportError(e, { scope: 'uploadPhoto', date });
      setError(e.message ?? 'Upload failed');
      return { success: false };
    } finally {
      setUploading(false);
    }
  }

  return { uploadPhoto, uploading, error };
}

async function compressPhoto(uri: string): Promise<string> {
  // Get original dimensions with a no-op pass
  const { width, height } = await ImageManipulator.manipulateAsync(uri, []);

  const actions: ImageManipulator.Action[] = [];
  const currentRatio = width / height;
  const targetRatio = 3 / 4; // portrait

  if (Math.abs(currentRatio - targetRatio) > 0.01) {
    if (currentRatio > targetRatio) {
      // Too wide — trim sides
      const cropWidth = Math.round(height * targetRatio);
      actions.push({ crop: { originX: Math.round((width - cropWidth) / 2), originY: 0, width: cropWidth, height } });
    } else {
      // Too tall — trim top and bottom
      const cropHeight = Math.round(width / targetRatio);
      actions.push({ crop: { originX: 0, originY: Math.round((height - cropHeight) / 2), width, height: cropHeight } });
    }
  }

  // 1080×1440 after the 3:4 portrait crop
  actions.push({ resize: { width: 1080 } });

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: 0.82,
    format: ImageManipulator.SaveFormat.WEBP,
  });
  return result.uri;
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
    const storagePath = `${userId}/${date}/${photo.id}.webp`;

    // upsert so a retry after a partial success doesn't fail on "already exists"
    const { error: storageError } = await supabase.storage
      .from('photos')
      .upload(storagePath, decode(base64), { contentType: 'image/webp', upsert: true });
    if (storageError) throw storageError;

    const { error: insertError } = await supabase
      .from('photos')
      .upsert(
        {
          id: photo.id,
          user_id: userId,
          date,
          color_id: colorId,
          storage_path: storagePath,
          created_at: photo.created_at,
        },
        { onConflict: 'id' }
      );
    if (insertError) throw insertError;

    await localStore.updatePhoto(date, photo.id, {
      sync_status: 'synced',
      storage_path: storagePath,
    });
  } catch (e) {
    // Cloud failed — queue for retry
    reportError(e, { scope: 'uploadToCloud', photoId: photo.id });
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
