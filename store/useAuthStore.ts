import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { reportError } from '@/lib/reportError';

interface AuthState {
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export const useAuthStore = create<AuthState>(() => ({
  session: null,
  loading: true,
  error: null,
}));

// Module-level guard so the session bootstrap + auth listener run exactly once,
// no matter how many components call useAuth().
let initialized = false;

export async function initAuth() {
  if (initialized) return;
  initialized = true;

  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      useAuthStore.setState({ session: data.session, loading: false });
    } else {
      // Phase 1: anonymous session — real user_id, no credentials.
      const { data: anon, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      useAuthStore.setState({ session: anon.session, loading: false });
    }
  } catch (e: any) {
    reportError(e, { scope: 'initAuth' });
    useAuthStore.setState({ error: e.message ?? 'Authentication failed', loading: false });
  }

  // Single listener keeps the store in sync for the app's lifetime.
  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.setState({ session });
  });
}
