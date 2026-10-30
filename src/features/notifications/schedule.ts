// Notifications locales (docs/06 F9) : rappels quotidiens recalculés à chaque ouverture et mutation.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { useAuthStore } from '@/features/auth/authStore';
import { supabase } from '@/lib/supabase';

import { planDailyReminders } from './reminderPlan';

export const DAILY_KIND = 'daily';
export const REMIND_KIND = 'remind';

/** Notifications affichées même app ouverte. */
export function configureNotifications() {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function cancelKind(kind: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.kind === kind)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

async function reschedule(): Promise<void> {
  const userId = useAuthStore.getState().session?.user.id;
  if (!userId) return;
  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase.from('profiles').select('reminders_enabled, reminder_time').eq('id', userId).single(),
    supabase
      .from('plant_overview')
      .select('id, nickname, species_id, created_at, water_every_days, last_watered_at'),
  ]);
  if (!profile) return;
  // Rappels désactivés : plus aucune notification planifiée (docs/06 F9).
  if (!profile.reminders_enabled) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }
  await cancelKind(DAILY_KIND);
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  const plan = planDailyReminders(
    (rows ?? []).map((r) => ({
      id: r.id!,
      nickname: r.nickname!,
      speciesId: r.species_id!,
      createdAt: new Date(r.created_at!),
      waterEveryDays: r.water_every_days!,
      lastWateredAt: r.last_watered_at ? new Date(r.last_watered_at) : null,
    })),
    profile.reminder_time,
  );
  for (const reminder of plan) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { kind: DAILY_KIND, plantId: reminder.plantId },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder.date },
    });
  }
}

// Un seul recalcul à la fois ; les demandes rapprochées se regroupent.
let running: Promise<void> | null = null;
let again = false;

/** Recalcule les rappels quotidiens (ouverture, arrosage, ajout, réglages). Jamais bloquant. */
export async function rescheduleReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    do {
      again = false;
      await reschedule().catch(() => undefined);
    } while (again);
  })();
  try {
    await running;
  } finally {
    running = null;
  }
}

/** Déconnexion / suppression du compte : plus aucune notification (docs/06 F1). */
export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
}
