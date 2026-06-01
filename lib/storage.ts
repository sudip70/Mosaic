import { supabase } from './supabase';

const SIGNED_URL_TTL = 60 * 60; // 1 hour

export async function getPhotoUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('photos')
    .createSignedUrl(storagePath, SIGNED_URL_TTL);
  if (error || !data) throw new Error(`Failed to sign photo URL: ${error?.message}`);
  return data.signedUrl;
}

export async function deletePhoto(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from('photos').remove([storagePath]);
  if (error) throw new Error(`Failed to delete photo: ${error.message}`);
}
