import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useProfileStore, loadProfile } from '@/store/useProfileStore';

/**
 * Reactive access to the current user's profile. Reloads whenever the auth
 * user_id changes (e.g. after sign-out drops onto a fresh anonymous session),
 * so the account state always reflects who's signed in right now.
 *
 * `hasAccount` is the app-wide "has created an account" flag — true once a
 * username exists, regardless of whether the email was really verified or the
 * OTP step was bypassed for testing.
 */
export function useProfile() {
  const userId = useAuthStore((s) => s.session?.user?.id);
  const profile = useProfileStore((s) => s.profile);
  const loading = useProfileStore((s) => s.loading);
  const loaded = useProfileStore((s) => s.loaded);

  useEffect(() => { loadProfile(); }, [userId]);

  return { profile, hasAccount: !!profile?.username, loading, loaded };
}
