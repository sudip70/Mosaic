// Account entry — two modes:
//   signup: turns the anonymous session permanent via updateUser({ email }) +
//           verifyOtp (preserves user_id, so all data carries over), then a
//           profile step (name, username, DOB).
//   signin: returning-user log in via signInWithOtp + verifyOtp, swapping the
//           anonymous session for the existing account. No profile step.
// `onboarding=1` means we were launched from onboarding, so completing the flow
// finishes onboarding and enters the app rather than just popping back.
import { useState } from 'react';
import { View, TextInput, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { DatePicker } from '@/components/ui/DatePicker';
import { useAuth } from '@/hooks/useAuth';
import { loadProfile } from '@/store/useProfileStore';
import { markOnboarded } from '@/store/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { fonts, radius, spacing, type Palette } from '@/lib/theme';
import { ChevronLeft, Mail, Check, Calendar, ICON_STROKE } from '@/lib/icons';
import { BYPASS_OTP } from '@/lib/constants';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = 'email' | 'code' | 'profile';

export default function AuthScreen() {
  const params = useLocalSearchParams<{ mode?: string; onboarding?: string }>();
  const isSignin = params.mode === 'signin';
  const fromOnboarding = params.onboarding === '1';

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; username?: string; dob?: string }>({});
  const [busy, setBusy] = useState(false);

  const { linkEmail, verifyEmailOtp, signIn, verifySignIn, checkUsername, upsertProfile } = useAuth();
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);

  const emailValid = EMAIL_RE.test(email);
  // Supabase's email OTP length is a project setting (6–10 digits), so accept any
  // length in that range rather than hardcoding one and breaking if it changes.
  const codeValid = /^\d{6,10}$/.test(code);

  // Leave the flow: into the app when we came from onboarding, otherwise back.
  // From onboarding the auth screen sits pushed on top of the onboarding screen,
  // so dismiss back to it first, then replace it with the app — otherwise
  // onboarding would linger in the stack behind the tabs.
  async function complete() {
    if (fromOnboarding) {
      await markOnboarded();
      router.dismissAll();
      router.replace('/');
    } else {
      router.back();
    }
  }

  async function sendCode() {
    if (!emailValid || busy) return;
    // Dev bypass (signup only): skip the email/OTP round-trip and go straight to
    // the profile step so the flow can be tested without sending an email. Sign
    // in always needs real auth, so it's never bypassed.
    if (BYPASS_OTP && !isSignin) {
      setError(null);
      setStep('profile');
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = isSignin
      ? await signIn(email.trim())
      : await linkEmail(email.trim());
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep('code');
  }

  async function verify() {
    if (!codeValid || busy) return;
    setBusy(true);
    setError(null);
    const { error } = isSignin
      ? await verifySignIn(email.trim(), code)
      : await verifyEmailOtp(email.trim(), code);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setError(null);
    if (isSignin) {
      // Signed in as the existing account — load their profile and enter.
      await loadProfile();
      await complete();
    } else {
      // Session is now permanent; collect profile details before leaving.
      setStep('profile');
    }
  }

  async function finishProfile() {
    if (busy) return;

    // Synchronous field checks first — every field is required.
    const nm = name.trim();
    const un = username.trim();
    const errs: { name?: string; username?: string; dob?: string } = {};
    if (!nm) errs.name = 'Please enter your name.';
    // Letters (incl. common accented ones) and spaces only — no digits or symbols.
    else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/.test(nm)) errs.name = 'Letters and spaces only, no numbers or symbols.';
    if (!un) errs.username = 'Please choose a username.';
    else if (un.length < 3) errs.username = 'At least 3 characters.';
    if (!dob) errs.dob = 'Please select your birthday.';

    setFieldErrors(errs);
    setError(null);
    if (Object.keys(errs).length > 0) return;

    setBusy(true);
    // Uniqueness pre-check for a friendly message; the unique index below is the
    // real guarantee against a race between two signups.
    const { data: available, error: checkErr } = await checkUsername(un);
    if (checkErr) { setBusy(false); setError(checkErr.message); return; }
    if (!available) { setBusy(false); setFieldErrors({ username: 'That username is taken.' }); return; }

    const { error } = await upsertProfile({
      full_name: nm,
      username: un,
      date_of_birth: dob!,
      email: email.trim() || null,
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
    // Pull the new profile into the store so the rest of the app reflects the
    // account immediately on return.
    await loadProfile();
    await complete();
  }

  const dobLabel = dob ? format(parseISO(dob), 'd MMMM yyyy') : 'Your birthday';

  // Header back: step 'code' returns to email; 'profile' is past the point of no
  // return (the account already exists), so it just dismisses, same as Skip.
  const onBack = () => (step === 'code' ? setStep('email') : router.back());
  const headerTitle =
    step === 'code' ? 'Enter code'
    : step === 'profile' ? 'Your profile'
    : isSignin ? 'Log in' : 'Create account';

  return (
    <AppScreen edges={['top', 'bottom']}>
      <ScreenHeader
        title={headerTitle}
        left={{ icon: ChevronLeft, accessibilityLabel: 'Back', onPress: onBack }}
      />

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Copy + inputs live up top; the action pins to the bottom of the screen. */}
        <View style={s.body}>
          {step === 'email' && (
            <>
              <AppText variant="serifLg" style={s.title}>
                {isSignin ? 'Welcome back' : 'Save your work'}
              </AppText>
              <AppText variant="body" style={s.sub}>
                {isSignin
                  ? 'Enter the email for your account and we’ll send a code to sign you back in.'
                  : 'Add your email to keep your colours, streak and mosaics safe, and pick up where you left off on any device. Everything you’ve made so far comes with you.'}
              </AppText>

              <View style={s.field}>
                <AppText variant="overline">Email address</AppText>
                <TextInput
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(null); }}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.ink30}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={s.input}
                />
              </View>

              {error && <AppText variant="body" style={s.error}>{error}</AppText>}
            </>
          )}

          {step === 'code' && (
            <>
              <AppText variant="serifLg" style={s.title}>Check your email</AppText>
              <AppText variant="body" style={s.sub}>
                We sent a code to {email}. Enter it below to finish.
              </AppText>

              <View style={s.field}>
                <AppText variant="overline">Verification code</AppText>
                <TextInput
                  value={code}
                  onChangeText={(t) => { setCode(t.replace(/\D/g, '').slice(0, 10)); setError(null); }}
                  placeholder="––––––"
                  placeholderTextColor={colors.ink30}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  maxLength={10}
                  style={[s.input, s.codeInput]}
                />
              </View>

              {error && <AppText variant="body" style={s.error}>{error}</AppText>}
            </>
          )}

          {step === 'profile' && (
            <>
              <AppText variant="serifLg" style={s.title}>You’re all set</AppText>
              <AppText variant="body" style={s.sub}>
                A few details to make Mosaic yours.
              </AppText>

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
                    // Row lives on a child View: a Pressable carrying flexDirection
                    // gets dropped on the New Architecture and collapses to a column.
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

              {error && <AppText variant="body" style={s.error}>{error}</AppText>}
            </>
          )}
        </View>

        <View style={s.actions}>
          {step === 'email' && (
            <PrimaryButton
              label={BYPASS_OTP && !isSignin ? 'Continue' : busy ? 'Sending…' : 'Send code'}
              icon={BYPASS_OTP && !isSignin ? Check : Mail}
              onPress={sendCode}
              disabled={!emailValid || busy}
            />
          )}

          {step === 'code' && (
            <>
              <PrimaryButton
                label={busy ? 'Verifying…' : 'Verify & save'}
                icon={Check}
                onPress={verify}
                disabled={!codeValid || busy}
              />
              <Pressable onPress={sendCode} disabled={busy} accessibilityRole="button" style={s.linkBtn}>
                <AppText variant="body" style={s.linkText}>Didn’t get it? Resend code</AppText>
              </Pressable>
            </>
          )}

          {step === 'profile' && (
            <PrimaryButton
              label={busy ? 'Saving…' : 'Finish'}
              icon={Check}
              onPress={finishProfile}
              disabled={busy}
            />
          )}
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
  body: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.x3, gap: spacing.md },
  actions: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.md },
  title: {},
  sub: { lineHeight: 21, color: c.ink60 },
  field: { gap: spacing.sm, paddingTop: spacing.sm },
  input: {
    backgroundColor: c.surface0, borderWidth: 1, borderColor: c.ink15,
    borderRadius: radius.r16, paddingHorizontal: spacing.lg, paddingVertical: 14,
    fontFamily: fonts.sans, fontSize: 15, color: c.ink100,
  },
  inputError: { borderColor: '#C62828' },
  codeInput: {
    textAlign: 'center', fontSize: 24, letterSpacing: 5,
    fontFamily: fonts.sansMd,
  },
  dobRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dobPressed: { backgroundColor: c.surface1 },
  dobText: { color: c.ink100, flex: 1 },
  dobPlaceholder: { color: c.ink30 },
  error: { color: '#C62828', fontSize: 13 },
  linkBtn: { alignItems: 'center', paddingTop: spacing.sm },
  linkText: { color: c.ink60, fontSize: 13 },
});
