import { useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Device from 'expo-device';
import { randomUUID } from 'expo-crypto';
// piexifjs is CommonJS
// eslint-disable-next-line @typescript-eslint/no-require-imports
const piexif = require('piexifjs') as typeof import('piexifjs');
import { localStore } from '@/lib/localStore';
import { reportError } from '@/lib/reportError';
import { usePhotoStore } from '@/store/usePhotoStore';
import { useStreakStore } from '@/store/useStreakStore';
import { useAnalytics } from './useAnalytics';
import type { Photo } from '@/types';

const PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;
const MAX_FILE_SIZE = 15 * 1024 * 1024;

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
    stamped = false,
    iosExif?: Record<string, any>,
  ) {
    setUploading(true);
    setError(null);
    try {
      const sourceInfo = await FileSystem.getInfoAsync(uri);
      if (!sourceInfo.exists) throw new Error('Selected file no longer exists');
      if ((sourceInfo.size ?? 0) > MAX_FILE_SIZE) {
        throw new Error('Photo is too large. Please choose a smaller image.');
      }

      const compressedUri = await compressPhoto(uri, iosExif);

      const photoId = randomUUID();
      const localDir = `${PHOTOS_DIR}${userId}/${date}/`;
      const localUri = `${localDir}${photoId}.jpg`;

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

      await localStore.savePhoto(date, photo);
      addPhoto(date, photo);
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

// ─── Compression ──────────────────────────────────────────────────────────────

async function compressPhoto(uri: string, iosExif?: Record<string, any>): Promise<string> {
  const { width, height } = await ImageManipulator.manipulateAsync(uri, []);

  const actions: ImageManipulator.Action[] = [];
  const currentRatio = width / height;
  const targetRatio = 3 / 4;

  if (Math.abs(currentRatio - targetRatio) > 0.01) {
    if (currentRatio > targetRatio) {
      const cropWidth = Math.round(height * targetRatio);
      actions.push({ crop: { originX: Math.round((width - cropWidth) / 2), originY: 0, width: cropWidth, height } });
    } else {
      const cropHeight = Math.round(width / targetRatio);
      actions.push({ crop: { originX: 0, originY: Math.round((height - cropHeight) / 2), width, height: cropHeight } });
    }
  }

  actions.push({ resize: { width: 1080 } });

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: 0.85,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  await injectExif(result.uri, iosExif);
  return result.uri;
}

// ─── EXIF injection ───────────────────────────────────────────────────────────
// expo-image-manipulator always strips metadata. We rebuild it from the iOS
// EXIF dictionary returned by takePictureAsync / launchImageLibraryAsync with
// exif:true, then write it back into the JPEG.
//
// We pass data URIs straight to piexif.insert and let piexifjs handle base64.
// piexifjs uses window.atob/btoa when present and otherwise falls back to a
// deterministic pure-JS implementation — so this works even if Hermes lacks the
// globals, whereas calling atob() ourselves would throw outright.

async function injectExif(jpegUri: string, iosExif?: Record<string, any> | null): Promise<void> {
  try {
    const exifObj  = buildExifObj(iosExif);
    const exifBytes = piexif.dump(exifObj);

    const jpegB64 = await FileSystem.readAsStringAsync(jpegUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const withExif = piexif.insert(exifBytes, `data:image/jpeg;base64,${jpegB64}`);
    const newB64   = withExif.split(',')[1];

    await FileSystem.writeAsStringAsync(jpegUri, newB64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (e) {
    reportError(e, { scope: 'injectExif' });
  }
}

// ─── iOS → piexifjs format conversion ────────────────────────────────────────
// Both expo-camera and expo-image-picker FLATTEN the Exif dictionary to the top
// level of the returned `exif` object — there is no "{Exif}" wrapper:
//   • expo-camera   → response["exif"] = <Exif dict contents> + Orientation
//   • expo-picker   → <Exif dict contents> + TIFF merged in (Make/Model/DateTime)
// So every field is read directly off `ios`. Make/Model/DateTime are present for
// gallery picks (TIFF merge) but absent for camera captures (no TIFF returned),
// so we fall back to expo-device constants for those.
// piexifjs uses numeric tag IDs; RATIONAL values must be [numerator, denominator].

function buildExifObj(ios?: Record<string, any> | null): Record<string, Record<number, any>> {
  const result: Record<string, Record<number, any>> = {
    '0th': {}, 'Exif': {}, 'GPS': {}, 'Interop': {}, '1st': {},
  };

  const rat = (v: number, scale = 10000): [number, number] =>
    [Math.round(v * scale), scale];

  // Guard `tag != null` too: an unknown piexif constant evaluates to undefined,
  // which would create an "undefined" key that makes piexif.dump throw and abort
  // the entire injection — silently dropping ALL metadata.
  const set0 = (tag: number | undefined, v: unknown) => { if (tag != null && v != null && v !== '') result['0th'][tag] = v; };
  const setE = (tag: number | undefined, v: unknown) => { if (tag != null && v != null && v !== '') result['Exif'][tag]  = v; };

  set0(piexif.ImageIFD.Software, 'Mosaic');

  const src: Record<string, any> = ios ?? {};

  // Image IFD — Make/Model/DateTime come from the merged TIFF data on gallery
  // picks; for camera captures (no TIFF) fall back to the running device.
  set0(piexif.ImageIFD.Make,     src.Make  ?? Device.manufacturer ?? Device.brand);
  set0(piexif.ImageIFD.Model,    src.Model ?? Device.modelName);
  set0(piexif.ImageIFD.DateTime, src.DateTime);
  // ImageManipulator bakes rotation into the pixels and outputs upright, so the
  // orientation tag must be 1 (normal). Copying the original capture orientation
  // would tell viewers to rotate an already-upright image → double rotation.
  set0(piexif.ImageIFD.Orientation, 1);

  // Exif IFD — all fields are top-level on `src`
  if (typeof src.ExposureTime === 'number')
    setE(piexif.ExifIFD.ExposureTime, rat(src.ExposureTime, 1_000_000));
  if (typeof src.FNumber === 'number')
    setE(piexif.ExifIFD.FNumber, rat(src.FNumber, 100));
  if (typeof src.FocalLength === 'number')
    setE(piexif.ExifIFD.FocalLength, rat(src.FocalLength, 1000));
  if (typeof src.FocalLenIn35mmFilm === 'number')
    setE(piexif.ExifIFD.FocalLengthIn35mmFilm, Math.round(src.FocalLenIn35mmFilm));

  const iso = Array.isArray(src.ISOSpeedRatings)
    ? src.ISOSpeedRatings
    : typeof src.ISOSpeedRatings === 'number' ? [src.ISOSpeedRatings] : null;
  if (iso) setE(piexif.ExifIFD.ISOSpeedRatings, iso);

  if (typeof src.LensMake  === 'string') setE(piexif.ExifIFD.LensMake,  src.LensMake);
  if (typeof src.LensModel === 'string') setE(piexif.ExifIFD.LensModel, src.LensModel);

  if (typeof src.DateTimeOriginal  === 'string') setE(piexif.ExifIFD.DateTimeOriginal,  src.DateTimeOriginal);
  if (typeof src.DateTimeDigitized === 'string') setE(piexif.ExifIFD.DateTimeDigitized, src.DateTimeDigitized);

  if (typeof src.Flash           === 'number') setE(piexif.ExifIFD.Flash,           Math.round(src.Flash));
  if (typeof src.MeteringMode    === 'number') setE(piexif.ExifIFD.MeteringMode,    Math.round(src.MeteringMode));
  if (typeof src.ExposureProgram === 'number') setE(piexif.ExifIFD.ExposureProgram, Math.round(src.ExposureProgram));
  if (typeof src.ExposureMode    === 'number') setE(piexif.ExifIFD.ExposureMode,    Math.round(src.ExposureMode));
  if (typeof src.WhiteBalance    === 'number') setE(piexif.ExifIFD.WhiteBalance,    Math.round(src.WhiteBalance));

  return result;
}
