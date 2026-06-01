// Phase 2
import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Section } from '@/components/layout/Section';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { signInWithMagicLink } = useAuth();

  async function handleSend() {
    await signInWithMagicLink(email);
    setSent(true);
  }

  return (
    <Screen>
      <Section className="flex-1 justify-center gap-6">
        <Typography variant="title">Sign in</Typography>
        {sent ? (
          <Typography variant="body">Check your email for a magic link.</Typography>
        ) : (
          <>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              className="border border-gray-200 rounded-xl px-4 py-3 text-base"
            />
            <Button label="Send magic link" onPress={handleSend} fullWidth />
          </>
        )}
      </Section>
    </Screen>
  );
}
