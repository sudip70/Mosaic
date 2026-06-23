import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore, initAuth } from '@/store/useAuthStore';

/**
 * Thin accessor over the singleton auth store. Every consumer shares the same
 * session, loading and error state; the bootstrap + auth listener run once.
 */
export function useAuth() {
  const session = useAuthStore((s) => s.session);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);

  useEffect(() => { initAuth(); }, []);

  return {
    session,
    user: session?.user ?? null,
    isAnonymous: session?.user?.is_anonymous ?? true,
    email: session?.user?.email ?? null,
    loading,
    error,
    // Convert an anonymous user into a permanent one. updateUser links the email
    // to the SAME user_id, so every row (photos, streaks, mosaics) keyed to that
    // id via RLS carries over untouched — unlike signInWithOtp, which would mint
    // a separate account and orphan all the anonymous data.
    //
    // Supabase emails a 6-digit code for this (type: 'email_change'); for it to
    // arrive as a code rather than only a link, the "Change Email Address"
    // template in Supabase must include {{ .Token }}.
    linkEmail: (email: string) => supabase.auth.updateUser({ email }),
    verifyEmailOtp: (email: string, token: string) =>
      supabase.auth.verifyOtp({ email, token, type: 'email_change' }),
    // Returning-user sign in. shouldCreateUser:false so an unknown email errors
    // (this is "log in", not "sign up"). Signing in replaces the current
    // anonymous session with the existing account, restoring its cloud data.
    signIn: (email: string) =>
      supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } }),
    verifySignIn: (email: string, token: string) =>
      supabase.auth.verifyOtp({ email, token, type: 'email' }),
    // Is a username free? Returns the RPC's boolean (true = available). Used for
    // inline form validation; the unique index is the hard guarantee.
    checkUsername: (username: string) =>
      supabase.rpc('username_available', { uname: username }),
    // Persist the profile captured after verification into the profiles table.
    // Upsert on the user's own id; a duplicate username trips the unique index
    // (error code 23505), which the form turns into a "taken" message.
    upsertProfile: async (profile: {
      full_name: string;
      username: string;
      date_of_birth: string;
      email?: string | null;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return { error: { message: 'Not signed in', code: 'no_session' } as const };
      return supabase.from('profiles').upsert({ id: uid, ...profile });
    },
    signOut: () => supabase.auth.signOut(),
    // Permanently delete the signed-in user via the delete_user RPC (cascades
    // their data and frees the email). signOut then drops them onto a fresh
    // anonymous session through the auth listener.
    deleteAccount: async () => {
      const { error } = await supabase.rpc('delete_user');
      if (error) return { error };
      await supabase.auth.signOut();
      return { error: null };
    },
  };
}
