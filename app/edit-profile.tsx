// Edit the account profile: name, username and date of birth. Email is shown but
// locked for now (changing it needs the email-verification flow). Reuses the same
// validation + uniqueness rules as the signup profile step.
import { useEffect, useState } from 'react';
import { View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { DatePicker } from '@/components/ui/DatePicker';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { loadProfile } from '@/store/useProfileStore';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { fonts, radius, spacing, type Palette } from '@/lib/theme';
import { ChevronLeft, Calendar, Check, Lock, ICON_STROKE } from '@/lib/icons';

export default function EditProfileScreen() {
  const { profile } = useProfile();
  const { checkUsername, upsertProfile } = useAuth();
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; username?: string; dob?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Seed the form from the loaded profile, once, without clobbering edits.
  useEffect(() => {
    if (profile && !hydrated) {
      setName(profile.full_name ?? '');
      setUsername(profile.username ?? '');
      setDob(profile.date_of_birth ?? null);
      setHydrated(true);
    }
  }, [profile, hydrated]);

  const dobLabel = dob ? format(parseISO(dob), 'd MMMM yyyy') : 'Your birthday';

  async function save() {
    if (busy) return;

    const nm = name.trim();
    const un = username.trim();
    const errs: { name?: string; username?: string; dob?: string } = {};
    if (!nm) errs.name = 'Please enter your name.';
    else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/.test(nm)) errs.name = 'Letters and spaces only, no numbers or symbols.';
    if (!un) errs.username = 'Please choose a username.';
    else if (un.length < 3) errs.username = 'At least 3 characters.';
    if (!dob) errs.dob = 'Please select your birthday.';

    setFieldErrors(errs);
    setError(null);
    if (Object.keys(errs).length > 0) return;

    setBusy(true);
    // The RPC excludes the caller's own row, so keeping your username is fine.
    const { data: available, error: checkErr } = await checkUsername(un);
    if (checkErr) { setBusy(false); setError(checkErr.message); return; }
    if (!available) { setBusy(false); setFieldErrors({ username: 'That username is taken.' }); return; }

    const { error } = await upsertProfile({
      full_name: nm,
      username: un,
      date_of_birth: dob!,
      email: profile?.email ?? null,
    });
    setBusy(false);
    if (error) {
      if ('code' in error && error.code === '23505') {
        setFieldErrors({ username: 'That username is taken.' });
        return;
      }
      setError(error.message);
      return;
    }
    await loadProfile();
    router.back();
  }

  return (
    <AppScreen edges={['top', 'bottom']}>
      <ScreenHeader
        title="Edit profile"
        left={{ icon: ChevronLeft, accessibilityLabel: 'Back', onPress: () => router.back() }}
      />

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.flex} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <View style={s.field}>
            <AppText variant="overline">Name</AppText>
            <TextInput
              value={name}
              onChangeText={(t) => { setName(t); setFieldErrors((e) => ({ ...e, name: undefined })); }}
              placeholder="Your name"
              placeholderTextColor={colors.ink30}
              autoCapitalize="words"
              autoComplete="name"
              style={[s.input, fieldErrors.name && s.inputError]}
            />
            {fieldErrors.name && <AppText variant="body" style={s.error}>{fieldErrors.name}</AppText>}
          </View>

          <View style={s.field}>
            <AppText variant="overline">Username</AppText>
            <TextInput
              value={username}
              onChangeText={(t) => {
                setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                setFieldErrors((e) => ({ ...e, username: undefined }));
              }}
              placeholder="username"
              placeholderTextColor={colors.ink30}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              style={[s.input, fieldErrors.username && s.inputError]}
            />
            {fieldErrors.username && <AppText variant="body" style={s.error}>{fieldErrors.username}</AppText>}
          </View>

          <View style={s.field}>
            <AppText variant="overline">Date of birth</AppText>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              accessibilityRole="button"
              accessibilityLabel="Select your date of birth"
            >
              {({ pressed }) => (
                <View style={[s.input, s.dobRow, pressed && s.dobPressed, fieldErrors.dob && s.inputError]}>
                  <Calendar size={18} color={dob ? colors.ink60 : colors.ink30} strokeWidth={ICON_STROKE} />
                  <AppText variant="body" numberOfLines={1} style={[s.dobText, !dob && s.dobPlaceholder]}>
                    {dobLabel}
                  </AppText>
                </View>
              )}
            </Pressable>
            {fieldErrors.dob && <AppText variant="body" style={s.error}>{fieldErrors.dob}</AppText>}
          </View>

          {/* Email — locked for now (changing it needs verification). */}
          <View style={s.field}>
            <AppText variant="overline">Email</AppText>
            <View style={[s.input, s.dobRow, s.locked]}>
              <Lock size={16} color={colors.ink30} strokeWidth={ICON_STROKE} />
              <AppText variant="body" numberOfLines={1} style={s.dobText}>
                {profile?.email ?? 'Not set'}
              </AppText>
            </View>
            <AppText variant="body" style={s.hint}>Email can’t be changed yet.</AppText>
          </View>

          {error && <AppText variant="body" style={s.error}>{error}</AppText>}
        </ScrollView>

        <View style={s.actions}>
          <PrimaryButton label={busy ? 'Saving…' : 'Save'} icon={Check} onPress={save} disabled={busy} />
        </View>
      </KeyboardAvoidingView>

      <DatePicker
        visible={showDatePicker}
        current={dob}
        onSelect={(d) => { setDob(d); setFieldErrors((e) => ({ ...e, dob: undefined })); }}
        onClose={() => setShowDatePicker(false)}
      />
    </AppScreen>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.x3, gap: spacing.md, paddingBottom: spacing.xl },
  actions: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  field: { gap: spacing.sm },
  input: {
    backgroundColor: c.surface0, borderWidth: 1, borderColor: c.ink15,
    borderRadius: radius.r16, paddingHorizontal: spacing.lg, paddingVertical: 14,
    fontFamily: fonts.sans, fontSize: 15, color: c.ink100,
  },
  inputError: { borderColor: '#C62828' },
  dobRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dobPressed: { backgroundColor: c.surface1 },
  dobText: { color: c.ink100, flex: 1 },
  dobPlaceholder: { color: c.ink30 },
  locked: { backgroundColor: c.surface1, opacity: 0.7 },
  hint: { color: c.ink30, fontSize: 12 },
  error: { color: '#C62828', fontSize: 13 },
});
