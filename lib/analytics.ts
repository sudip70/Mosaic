import * as Sentry from '@sentry/react-native';
import PostHog from 'posthog-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;

// SDK 54 makes the default `expo-file-system` legacy methods throw. PostHog's
// auto-detected file storage hits that on construction (even when disabled), so
// pin it to AsyncStorage, which the app already uses everywhere.
const posthogStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
};

const sentryEnabled = !!sentryDsn && sentryDsn !== 'your_sentry_dsn';
const posthogEnabled = !!posthogKey && posthogKey !== 'your_posthog_key';

export function initAnalytics() {
  if (!sentryEnabled) return;
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 0.2,
    enableNativeNagger: false,
  });
}

export const posthog = new PostHog(posthogEnabled ? posthogKey! : 'placeholder', {
  host: 'https://app.posthog.com',
  disabled: __DEV__ || !posthogEnabled,
  customStorage: posthogStorage,
});
