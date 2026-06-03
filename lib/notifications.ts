import * as Notifications from 'expo-notifications';
import { reportError } from './reportError';

const REMINDER_ID = 'morning-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Serialises concurrent calls so two rapid scheduleReminder() invocations
// (e.g. from Zustand persist hydration firing the effect twice) can't race.
let pendingSchedule: Promise<void> = Promise.resolve();

export function scheduleReminder(timeString: string): void {
  pendingSchedule = pendingSchedule.then(() => _schedule(timeString)).catch(() => {});
}

async function _schedule(timeString: string): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[notifications] permission not granted — skipping schedule');
      return;
    }
    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
    const { hour, minute } = parseTime(timeString);
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_ID,
      content: {
        title: 'A fresh colour today',
        body: 'Yours to find in the world around you.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    if (__DEV__) console.log(`[notifications] scheduled daily reminder at ${hour}:${String(minute).padStart(2, '0')}`);
  } catch (e) {
    reportError(e, { scope: 'scheduleReminder', timeString });
  }
}

export function cancelReminder(): void {
  pendingSchedule = pendingSchedule
    .then(() => Notifications.cancelScheduledNotificationAsync(REMINDER_ID))
    .catch(() => {});
}

// "8:30 AM" / "11:00 PM" → { hour: 0–23, minute: 0–59 }
function parseTime(timeString: string): { hour: number; minute: number } {
  const match = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return { hour: 8, minute: 30 };
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'AM' && hour === 12) hour = 0;
  if (period === 'PM' && hour !== 12) hour += 12;
  return { hour, minute };
}
