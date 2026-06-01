import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setSession(data.session);
        } else {
          const { data: anonData, error: anonError } =
            await supabase.auth.signInAnonymously();
          if (anonError) throw anonError;
          setSession(anonData.session);
        }
      } catch (e: any) {
        setError(e.message ?? 'Authentication failed');
      } finally {
        setLoading(false);
      }
    }

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signInWithMagicLink(email: string) {
    return supabase.auth.signInWithOtp({ email });
  }

  async function signOut() {
    return supabase.auth.signOut();
  }

  return {
    session,
    user: session?.user ?? null,
    isAnonymous: session?.user?.is_anonymous ?? true,
    loading,
    error,
    signInWithMagicLink,
    signOut,
  };
}
