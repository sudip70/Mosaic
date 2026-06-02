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
    loading,
    error,
    signInWithMagicLink: (email: string) => supabase.auth.signInWithOtp({ email }),
    signOut: () => supabase.auth.signOut(),
  };
}
