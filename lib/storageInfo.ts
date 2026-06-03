import * as FileSystem from 'expo-file-system/legacy';
import { reportError } from './reportError';

const PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;

// Recursively sum the byte size of a directory's files.
async function dirSize(dir: string): Promise<number> {
  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists || !info.isDirectory) return 0;
    const entries = await FileSystem.readDirectoryAsync(dir);
    let total = 0;
    for (const name of entries) {
      const path = `${dir}${name}`;
      const i = await FileSystem.getInfoAsync(path);
      if (!i.exists) continue;
      if (i.isDirectory) total += await dirSize(`${path}/`);
      else total += i.size ?? 0;
    }
    return total;
  } catch (e) {
    reportError(e, { scope: 'dirSize', dir });
    return 0;
  }
}

export interface StorageInfo {
  photosBytes: number;
  cacheBytes: number;
  freeBytes: number;
}

export async function getStorageInfo(): Promise<StorageInfo> {
  const [photosBytes, cacheBytes, freeBytes] = await Promise.all([
    dirSize(PHOTOS_DIR),
    dirSize(`${FileSystem.cacheDirectory}`),
    FileSystem.getFreeDiskStorageAsync().catch(() => 0),
  ]);
  return { photosBytes, cacheBytes, freeBytes };
}

// Clear app cache (temp/derived files). Saved photos live in documentDirectory
// and are never touched.
export async function clearCache(): Promise<void> {
  const cache = FileSystem.cacheDirectory;
  if (!cache) return;
  try {
    const entries = await FileSystem.readDirectoryAsync(cache);
    await Promise.all(
      entries.map((name) => FileSystem.deleteAsync(`${cache}${name}`, { idempotent: true }))
    );
  } catch (e) {
    reportError(e, { scope: 'clearCache' });
  }
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (mb < 1024) return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}
