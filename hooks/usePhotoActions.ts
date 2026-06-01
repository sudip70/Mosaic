import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { supabase } from '@/lib/supabase';
import { localStore } from '@/lib/localStore';
import { syncQueue } from '@/lib/syncQueue';
import { usePhotoStore } from '@/store/usePhotoStore';
import type { Photo } from '@/types';

const TMP_DIR = `${FileSystem.cacheDirectory}share/`;

// Resolve a guaranteed-local file URI for a photo. Remote-only photos are
// downloaded to a temp file first so they can be saved/shared.
async function resolveLocalUri(photo: Photo): Promise<string> {
  if (photo.local_uri) {
    const info = await FileSystem.getInfoAsync(photo.local_uri);
    if (info.exists) return photo.local_uri;
  }
  if (!photo.url) throw new Error('Photo file is unavailable');
  const dir = await FileSystem.getInfoAsync(TMP_DIR);
  if (!dir.exists) await FileSystem.makeDirectoryAsync(TMP_DIR, { intermediates: true });
  const dest = `${TMP_DIR}${photo.id}.jpg`;
  const { uri } = await FileSystem.downloadAsync(photo.url, dest);
  return uri;
}

export function usePhotoActions() {
  const [busy, setBusy] = useState(false);
  const removeFromStore = usePhotoStore((s) => s.removePhoto);

  // Save the photo to the device's photo library.
  async function download(photo: Photo): Promise<{ ok: boolean; message: string }> {
    setBusy(true);
    try {
      const { granted } = await MediaLibrary.requestPermissionsAsync();
      if (!granted) return { ok: false, message: 'Photo library permission denied' };
      const localUri = await resolveLocalUri(photo);
      await MediaLibrary.saveToLibraryAsync(localUri);
      return { ok: true, message: 'Saved to your photos' };
    } catch (e: any) {
      return { ok: false, message: e.message ?? 'Could not save photo' };
    } finally {
      setBusy(false);
    }
  }

  // Open the native share sheet for the photo.
  async function share(photo: Photo): Promise<{ ok: boolean; message: string }> {
    setBusy(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        return { ok: false, message: 'Sharing is not available on this device' };
      }
      const localUri = await resolveLocalUri(photo);
      await Sharing.shareAsync(localUri, { mimeType: 'image/jpeg', dialogTitle: 'Share photo' });
      return { ok: true, message: '' };
    } catch (e: any) {
      return { ok: false, message: e.message ?? 'Could not share photo' };
    } finally {
      setBusy(false);
    }
  }

  // Remove the photo everywhere: device file, local cache, store, sync queue, cloud.
  async function remove(photo: Photo): Promise<{ ok: boolean; message: string }> {
    setBusy(true);
    try {
      // Local file
      if (photo.local_uri) {
        await FileSystem.deleteAsync(photo.local_uri, { idempotent: true });
      }
      // Local metadata + in-memory store + pending queue
      await localStore.deletePhoto(photo.date, photo.id);
      removeFromStore(photo.date, photo.id);
      await syncQueue.remove(photo.id);

      // Cloud — best effort (ignore if offline)
      if (photo.storage_path) {
        await supabase.storage.from('photos').remove([photo.storage_path]);
      }
      await supabase.from('photos').delete().eq('id', photo.id);

      return { ok: true, message: 'Photo deleted' };
    } catch (e: any) {
      return { ok: false, message: e.message ?? 'Could not delete photo' };
    } finally {
      setBusy(false);
    }
  }

  return { download, share, remove, busy };
}
