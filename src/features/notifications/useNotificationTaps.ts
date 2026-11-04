import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { go } from '@/motion/transitions';

import { rescheduleReminders } from './schedule';
import { targetOf } from './target';

function open(response: Notifications.NotificationResponse | null) {
  if (!response) return;
  const target = targetOf(response.notification.request.content.data);
  if (target.to === 'garden') go('garden', { anim: 'fade' });
  else go(target.to, { id: target.id, anim: target.to === 'plant' ? 'zoom' : undefined });
}

/**
 * Dans l'app connectée : tap sur une notification (à chaud et à froid) et recalcul des rappels
 * à l'ouverture et à chaque retour au premier plan.
 */
export function useNotificationTaps() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    void rescheduleReminders();
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      open(response);
      void Notifications.clearLastNotificationResponseAsync();
    });
    const tap = Notifications.addNotificationResponseReceivedListener(open);
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') void rescheduleReminders();
    });
    return () => {
      tap.remove();
      foreground.remove();
    };
  }, []);
}
