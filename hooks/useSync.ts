import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import { syncQueue } from '@/lib/syncQueue';
import { localStore } from '@/lib/localStore';
import { reportError } from '@/lib/reportError';

// Module-level lock — prevents concurrent runs if network events fire rapidly.
let isProcessing = false;

export function useSync() {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) processQueue();
    });

    processQueue();

    return () => unsubscribe();
  }, []);
}

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const queue = await syncQueue.getQueue();
    if (queue.length === 0) return;

    // RLS ties every row to the signed-in user, so always upload under the
    // CURRENT session. When the session is unchanged this equals the original
    // owner; when an anonymous session was recreated, it re-owns the orphaned
    // item to the new user (this device) instead of failing the policy forever.
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) return; // can't satisfy RLS without a session — retry next time

    for (const item of queue) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(item.localUri);

        if (!fileInfo.exists || (fileInfo.size !== undefined && fileInfo.size < 100)) {
          // File missing or corrupt — remove from queue rather than retrying forever.
          await syncQueue.remove(item.id);
          continue;
        }

        const base64 = await FileSystem.readAsStringAsync(item.localUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const ext = item.localUri.endsWith('.webp') ? 'webp' : 'jpg';
        const contentType = ext === 'webp' ? 'image/webp' : 'image/jpeg';
        const storagePath = `${uid}/${item.date}/${item.id}.${ext}`;

        // upsert so a retried partial upload doesn't fail on duplicates
        const { error: storageError } = await supabase.storage
          .from('photos')
          .upload(storagePath, decode(base64), { contentType, upsert: true });
        if (storageError) throw storageError;

        const { error: insertError } = await supabase
          .from('photos')
          .upsert(
            {
              id: item.id,
              user_id: uid,
              date: item.date,
              color_id: item.colorId,
              storage_path: storagePath,
              created_at: item.createdAt,
            },
            { onConflict: 'id' }
          );
        if (insertError) throw insertError;

        await localStore.updatePhoto(item.date, item.id, {
          sync_status: 'synced',
          storage_path: storagePath,
          user_id: uid,
        });

        await syncQueue.remove(item.id);
      } catch (e) {
        // Network or server error — leave in queue, retry on next connection.
        reportError(e, { scope: 'syncQueue', photoId: item.id });
      }
    }
  } finally {
    isProcessing = false;
  }
}
