import { useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { randomUUID } from 'expo-crypto';
import { localStore } from '@/lib/localStore';
import { reportError } from '@/lib/reportError';
import { usePhotoStore } from '@/store/usePhotoStore';
import { useStreakStore } from '@/store/useStreakStore';
import { useAnalytics } from './useAnalytics';
import type { Photo } from '@/types';

const PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

// Phase 1 is local-only: captures are compressed and saved to the device, never
// uploaded. Cloud upload (sharing + opt-in backup) arrives in Phase 2 and is
// triggered by the privacy toggle, not by capture.
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
      const sourceInfo = await FileSystem.getInfoAsync(uri);
      if (!sourceInfo.exists) throw new Error('Selected file no longer exists');
      if ((sourceInfo.size ?? 0) > MAX_FILE_SIZE) {
        throw new Error('Photo is too large. Please choose a smaller image.');
      }

      const compressedUri = await compressPhoto(uri);

      const photoId = randomUUID();
      const localDir = `${PHOTOS_DIR}${userId}/${date}/`;
      const localUri = `${localDir}${photoId}.webp`;

      // Save to device — this is the only copy in Phase 1.
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
        sync_status: 'local',
        is_private: true,
        created_at: new Date().toISOString(),
        timestamp: stamped,
        url: localUri,
      };

      // Persist locally and update the UI immediately.
      await localStore.savePhoto(date, photo);
      addPhoto(date, photo);

      // Streak update — runs once per day (idempotent in the store).
      incrementStreak(date);

      track('photo_uploaded', { date });
      return { success: true };
    } catch (e: any) {
      reportError(e, { scope: 'uploadPhoto', date });
      setError(e.message ?? 'Could not save photo');
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
