import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useProfile } from '@/hooks/useProfile';
import { useUpgradePrompt } from '@/store/useUpgradePrompt';

interface NudgeCopy {
  title: string;
  body: string;
}

/**
 * Contextual "create an account" nudge for high-intent moments (a streak
 * milestone, a finished mosaic). Call `promptUpgrade(copy)` at the moment worth
 * celebrating; the hook itself decides whether to actually show — it stays
 * silent for users who already have an account, and throttles the rest via
 * useUpgradePrompt so a nudge never becomes a nag. Render `{nudge}` once in the
 * screen so the dialog has a home.
 */
export function useUpgradeNudge() {
  const { hasAccount } = useProfile();
  const { canPrompt, markShown, markDismissed } = useUpgradePrompt();
  const [copy, setCopy] = useState<NudgeCopy | null>(null);

  const promptUpgrade = useCallback(
    (c: NudgeCopy) => {
      if (hasAccount || !canPrompt()) return;
      markShown();
      setCopy(c);
    },
    [hasAccount, canPrompt, markShown]
  );

  const nudge = (
    <ConfirmDialog
      visible={!!copy}
      icon="✦"
      title={copy?.title ?? ''}
      body={copy?.body ?? ''}
      confirmLabel="Create account"
      cancelLabel="Not now"
      onConfirm={() => { setCopy(null); router.push('/(auth)/login'); }}
      onCancel={() => { markDismissed(); setCopy(null); }}
    />
  );

  return { promptUpgrade, nudge };
}
