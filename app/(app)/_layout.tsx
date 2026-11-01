import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';

import { useAuthStore } from '@/features/auth/authStore';
import { useProfile } from '@/features/auth/profile';
import { useNotificationTaps } from '@/features/notifications/useNotificationTaps';
import { makeStyles } from '@/theme';

/** Garde (docs/05) : session obligatoire, onboarding fait. */
export default function AppLayout() {
  const styles = useStyles();
  const ready = useAuthStore((s) => s.ready);
  const session = useAuthStore((s) => s.session);
  const { data: profile, isPending } = useProfile();

  if (!ready) return <View style={styles.blank} />;
  if (!session) return <Redirect href="/login" />;
  if (isPending) return <View style={styles.blank} />;
  if (!profile?.onboarded_at) return <Redirect href="/reminders" />;

  return <ConnectedApp />;
}

/** App connectée et onboardée : rappels recalculés, taps sur les notifications. */
function ConnectedApp() {
  useNotificationTaps();

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="new-plant" options={{ presentation: 'fullScreenModal' }} />
    </Stack>
  );
}

const useStyles = makeStyles((colors) => ({
  blank: { flex: 1, backgroundColor: colors.bg },
}));
