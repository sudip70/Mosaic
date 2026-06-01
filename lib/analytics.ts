import * as Sentry from '@sentry/react-native';
import PostHog from 'posthog-react-native';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;

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
});
