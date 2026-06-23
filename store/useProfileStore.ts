import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { reportError } from '@/lib/reportError';

export interface Profile {
  full_name: string | null;
  username: string | null;
  date_of_birth: string | null;
  email: string | null;
}

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  loaded: boolean;
}

// The profiles row is the source of truth for "has this device created an
// account". It's independent of auth.is_anonymous on purpose: during OTP-bypass
// testing the session stays anonymous, yet a completed profile still means the
// account-creation loop ran. Anything gating on "has an account" should read
// `profile?.username`, not isAnonymous.
export const useProfileStore = create<ProfileState>(() => ({
  profile: null,
  loading: false,
  loaded: false,
}));

export async function loadProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) {
    useProfileStore.setState({ profile: null, loading: false, loaded: true });
    return;
  }

  useProfileStore.setState({ loading: true });
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, username, date_of_birth, email')
      .eq('id', uid)
      .maybeSingle();
    if (error) throw error;
    useProfileStore.setState({ profile: data ?? null, loading: false, loaded: true });
  } catch (e: any) {
    reportError(e, { scope: 'loadProfile' });
    useProfileStore.setState({ loading: false, loaded: true });
  }
}
