// Phase 2 — magic-link sign in (not reachable in Phase 1)
import { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import { colors, fonts, radius, spacing } from '@/lib/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { signInWithMagicLink } = useAuth();

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleSend() {
    if (!valid) return;
    await signInWithMagicLink(email);
    setSent(true);
  }

  return (
    <AppScreen>
      <ScreenHeader
        title="Sign in"
        left={{ icon: '←', accessibilityLabel: 'Back', onPress: () => router.back() }}
      />
      <View style={s.body}>
        {sent ? (
          <View style={s.sentWrap}>
            <AppText variant="serifLg" style={s.sentTitle}>Check your email</AppText>
            <AppText variant="body" style={s.sentSub}>
              We sent a magic link to {email}. Tap it to finish signing in.
            </AppText>
          </View>
        ) : (
          <>
            <AppText variant="overline">Email address</AppText>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.ink30}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={s.input}
            />
            <PrimaryButton label="Send magic link" icon="✦" onPress={handleSend} disabled={!valid} />
          </>
        )}
      </View>
    </AppScreen>
  );
}

const s = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.x3, gap: spacing.md },
  input: {
    backgroundColor: colors.surface0, borderWidth: 1, borderColor: colors.ink15,
    borderRadius: radius.r16, paddingHorizontal: spacing.lg, paddingVertical: 14,
    fontFamily: fonts.sans, fontSize: 15, color: colors.ink100,
  },
  sentWrap: { gap: spacing.sm, paddingTop: spacing.x3 },
  sentTitle: {},
  sentSub: { color: colors.ink60, lineHeight: 21 },
});
