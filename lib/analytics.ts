import * as Sentry from '@sentry/react-native';
import PostHog from 'posthog-react-native';

export function initAnalytics() {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.2,
    enableNativeNagger: false,
  });
}

export const posthog = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_KEY!, {
  host: 'https://app.posthog.com',
  disabled: __DEV__,
});
