import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type ReminderPermission = { granted: boolean; pushToken: string | null };

/**
 * Demande l'autorisation des notifications (onboarding, docs/06 F2).
 * Le jeton push sert à la v2 (rappels serveur) : son absence (simulateur, web) n'empêche rien.
 */
export async function requestReminderPermission(): Promise<ReminderPermission> {
  if (Platform.OS === 'web') return { granted: false, pushToken: null };
  try {
    const current = await Notifications.getPermissionsAsync();
    const status = current.granted
      ? current
      : await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: false, allowSound: true },
        });
    if (!status.granted) return { granted: false, pushToken: null };
    return { granted: true, pushToken: await pushToken() };
  } catch {
    return { granted: false, pushToken: null };
  }
}

async function pushToken(): Promise<string | null> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    return null;
  }
}
