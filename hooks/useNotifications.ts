import { useEffect } from 'react';
import { useSettings } from '@/store/useSettings';
import { scheduleReminder, cancelReminder } from '@/lib/notifications';

export function useNotifications() {
  const morningReminder = useSettings((s) => s.morningReminder);
  const reminderTime = useSettings((s) => s.reminderTime);

  useEffect(() => {
    if (morningReminder) {
      scheduleReminder(reminderTime);
    } else {
      cancelReminder();
    }
  }, [morningReminder, reminderTime]);
}
