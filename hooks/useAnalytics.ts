import * as Sentry from '@sentry/react-native';
import { posthog } from '@/lib/analytics';

type EventName =
  | 'app_opened'
  | 'screen_viewed'
  | 'photo_uploaded'
  | 'day_viewed'
  | 'streak_milestone'
  | 'error_occurred';

type EventProperties = Record<string, string | number | boolean>;

export function useAnalytics() {
  function track(event: EventName, properties?: EventProperties) {
    posthog.capture(event, properties);
  }

  function captureError(error: Error, context?: Record<string, string>) {
    Sentry.withScope((scope) => {
      if (context) scope.setExtras(context);
      Sentry.captureException(error);
    });
  }

  function trackScreen(name: string) {
    track('screen_viewed', { screen_name: name });
  }

  return { track, captureError, trackScreen };
}
