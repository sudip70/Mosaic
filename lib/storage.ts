import { supabase } from './supabase';

const SIGNED_URL_TTL = 60 * 60; // 1 hour

export async function getPhotoUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('photos')
    .createSignedUrl(storagePath, SIGNED_URL_TTL);
  if (error || !data) throw new Error(`Failed to sign photo URL: ${error?.message}`);
  return data.signedUrl;
}
