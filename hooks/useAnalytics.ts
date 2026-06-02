import { posthog } from '@/lib/analytics';

type EventName =
  | 'screen_viewed'
  | 'photo_uploaded'
  | 'day_viewed'
  | 'streak_milestone';

type EventProperties = Record<string, string | number | boolean>;

export function useAnalytics() {
  function track(event: EventName, properties?: EventProperties) {
    posthog.capture(event, properties);
  }

  function trackScreen(name: string) {
    track('screen_viewed', { screen_name: name });
  }

  return { track, trackScreen };
}
