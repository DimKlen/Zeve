import Constants from 'expo-constants';
import { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconCheck } from '@/components/icons';
import { Rise } from '@/components/Rise';
import { Screen } from '@/components/Screen';
import { SettingsCard, SettingsRow } from '@/components/SettingsRow';
import { showToast } from '@/components/Toast';
import { Toggle } from '@/components/Toggle';
import { signOut } from '@/features/auth/auth';
import { useProfile } from '@/features/auth/profile';
import { requestReminderPermission } from '@/features/notifications/permissions';
import { formatTime } from '@/features/notifications/reminderPlan';
import { useRooms } from '@/features/plant/api';
import { useUpdateProfile } from '@/features/settings/api';
import { TimePickerSheet } from '@/features/settings/TimePickerSheet';
import { t } from '@/i18n';
import { confirm } from '@/lib/confirm';
import { go } from '@/motion/transitions';
import { colors, layout, radius, space, type } from '@/theme';

const PROVIDER_NAME: Record<string, string> = {
  google: 'Google',
  apple: 'Apple',
  email: t('connecting.providerEmail'),
};
const AVATAR = 56;

/** Réglages (docs/04 §10). */
export default function SettingsScreen() {
  const { data: profile } = useProfile();
  const { data: rooms } = useRooms();
  const update = useUpdateProfile();
  const [timeSheet, setTimeSheet] = useState(false);

  const email = profile?.display_email ?? '';
  const name = profile?.first_name || email.split('@')[0] || '';
  const initial = (profile?.first_name || email || '?').charAt(0).toUpperCase();
  const provider = PROVIDER_NAME[profile?.auth_provider ?? 'email'] ?? PROVIDER_NAME.email!;
  const reminderTime = profile?.reminder_time ?? '09:00:00';

  const toggleReminders = async (on: boolean) => {
    if (!on || Platform.OS === 'web') {
      update.mutate({ reminders_enabled: on });
      return;
    }
    const permission = await requestReminderPermission();
    if (permission.granted) {
      update.mutate({ reminders_enabled: true });
      showToast(t('toast.remindersOn'));
      return;
    }
    // Permission refusée : seuls les réglages du téléphone peuvent la rendre.
    const open = await confirm({
      title: t('settings.reminders'),
      message: t('settings.remindersDenied'),
      confirmLabel: t('settings.openSettings'),
      destructive: false,
    });
    if (open) void Linking.openSettings();
  };

  const logout = async () => {
    const ok = await confirm({
      title: t('settings.logoutConfirm'),
      confirmLabel: t('settings.logout'),
    });
    if (!ok) return;
    await signOut();
    go('login', { replace: true });
  };

  return (
    <Screen name="settings" refocusEnter="fade" edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          {t('settings.title')}
        </Text>

        <Rise delay="d1">
          <View style={styles.profile}>
            <View style={styles.avatar} importantForAccessibility="no-hide-descendants">
              <Text style={styles.initial}>{initial}</Text>
            </View>
            <View style={styles.profileTexts}>
              <Text style={styles.name}>{name}</Text>
              {!!email && <Text style={styles.email}>{email}</Text>}
              <View style={styles.badge}>
                <IconCheck size={12} color={colors.forest2} strokeWidth={3} />
                <Text style={styles.badgeText}>{t('settings.connectedWith', { provider })}</Text>
              </View>
            </View>
          </View>
        </Rise>

        <Rise delay="d2">
          <SettingsCard>
            <SettingsRow
              label={t('settings.reminders')}
              hint={t('settings.remindersHint')}
              right={
                <Toggle
                  value={!!profile?.reminders_enabled}
                  onValueChange={(on) => void toggleReminders(on)}
                  accessibilityLabel={t('settings.reminders')}
                />
              }
            />
            <SettingsRow
              label={t('settings.reminderTime')}
              value={formatTime(reminderTime)}
              onPress={() => setTimeSheet(true)}
            />
            <SettingsRow
              label={t('settings.rooms')}
              value={rooms ? String(rooms.length) : ''}
              onPress={() => go('rooms')}
              last
            />
          </SettingsCard>
        </Rise>

        <Rise delay="d3">
          <SettingsCard>
            <SettingsRow label={t('settings.privacy')} chevron onPress={() => go('privacy')} />
            <SettingsRow label={t('settings.logout')} danger last onPress={() => void logout()} />
          </SettingsCard>
        </Rise>

        <Pressable
          onLongPress={() => go('devPlants')}
          accessibilityHint={t('settings.devLongPressA11y')}
          style={styles.versionHit}
        >
          <Text style={styles.version}>
            {t('settings.version', { version: Constants.expoConfig?.version ?? '' })}
          </Text>
        </Pressable>
      </ScrollView>

      <TimePickerSheet
        key={reminderTime}
        visible={timeSheet}
        value={reminderTime}
        onClose={() => setTimeSheet(false)}
        onChange={(value) => update.mutate({ reminder_time: value })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: space.xs,
    paddingHorizontal: layout.screenPadTabs,
    paddingBottom: layout.bottomNavClearance,
    gap: space.xl,
  },
  title: { ...type.title, color: colors.forest },
  profile: {
    backgroundColor: colors.surface,
    borderRadius: radius.section,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.ml,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { ...type.plantName, color: colors.forest },
  profileTexts: { flex: 1, gap: 2 },
  name: { ...type.buttonL, color: colors.ink },
  email: { ...type.small, color: colors.inkMuted },
  badge: {
    alignSelf: 'flex-start',
    marginTop: space.xxs,
    height: 24,
    paddingHorizontal: space.sm,
    borderRadius: 12,
    backgroundColor: colors.well,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  badgeText: { ...type.micro, fontFamily: type.label.fontFamily, color: colors.inkSoft },
  versionHit: { alignSelf: 'center', padding: space.s },
  version: { ...type.micro, color: colors.inkMuted, textAlign: 'center' },
});
