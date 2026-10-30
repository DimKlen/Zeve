import { Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { IconSprout } from '@/components/icons';
import { Rise } from '@/components/Rise';
import { Screen } from '@/components/Screen';
import { TextButton } from '@/components/TextButton';
import { showToast } from '@/components/Toast';
import { isNetworkError } from '@/features/auth/auth';
import { useAuthStore } from '@/features/auth/authStore';
import { useCompleteOnboarding, useProfile } from '@/features/auth/profile';
import { requestReminderPermission } from '@/features/notifications/permissions';
import { t } from '@/i18n';
import { useNotifEnter } from '@/motion/useEnter';
import { go } from '@/motion/transitions';
import { PlantAvatar } from '@/plants/PlantAvatar';
import { a11y, colors, layout, radius, shadow, space, type } from '@/theme';

/** Bienvenue · rappels (docs/04 §6) : la seule étape d'onboarding. */
export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const ready = useAuthStore((s) => s.ready);
  const { data: profile } = useProfile();
  const complete = useCompleteOnboarding();
  const [busy, setBusy] = useState<'enable' | 'later' | null>(null);

  if (ready && !session) return <Redirect href="/login" />;

  const finish = async (choice: 'enable' | 'later') => {
    if (busy) return;
    setBusy(choice);
    try {
      // « Plus tard » ne demande rien ; un refus système continue quand même (docs/06 F2).
      const permission =
        choice === 'enable'
          ? await requestReminderPermission()
          : { granted: false, pushToken: null };
      await complete({ remindersEnabled: permission.granted, pushToken: permission.pushToken });
      if (permission.granted) showToast(t('toast.remindersOn'));
      go('garden', { replace: true });
    } catch (e) {
      showToast(isNetworkError(e) ? t('toast.offline') : t('connecting.failed'));
      setBusy(null);
    }
  };

  const name = profile?.first_name;
  return (
    <Screen name="reminders" edges={[]}>
      <View
        style={[
          styles.root,
          {
            paddingTop: insets.top + space.ml + 2,
            paddingBottom: Math.max(insets.bottom, space.x5),
          },
        ]}
      >
        <View style={styles.center}>
          <NotificationCard />
          <PlantAvatar speciesId="monstera" stage={3} size={200} face="full" bob />
          <Rise delay="d1">
            <Text
              style={styles.title}
              accessibilityRole="header"
              maxFontSizeMultiplier={a11y.maxTitleScale}
            >
              {name
                ? t('onboarding.remindersTitle', { name })
                : t('onboarding.remindersTitleNoName')}
            </Text>
          </Rise>
          <Rise delay="d2">
            <Text style={styles.text}>{t('onboarding.remindersText')}</Text>
          </Rise>
        </View>
        <Rise delay="d3" style={styles.actions}>
          <Button
            label={t('onboarding.remindersEnable')}
            loading={busy === 'enable'}
            disabled={busy === 'later'}
            onPress={() => finish('enable')}
          />
          <TextButton label={t('onboarding.later')} onPress={() => finish('later')} />
        </Rise>
      </View>
    </Screen>
  );
}

/** Exemple de notification (fixe, illustratif), entrée « notif » délai 0.5 s. */
function NotificationCard() {
  const enter = useNotifEnter();
  return (
    <Animated.View
      style={[styles.notif, shadow.notifCard, enter]}
      accessible
      accessibilityLabel={`${t('onboarding.notifExampleTitle')} : ${t('onboarding.notifExampleBody')}`}
    >
      <View style={styles.appIcon}>
        <IconSprout size={22} color={colors.splashStem} />
      </View>
      <View style={styles.notifText}>
        <Text style={styles.notifTitle}>{t('onboarding.notifExampleTitle')}</Text>
        <Text style={styles.notifBody}>{t('onboarding.notifExampleBody')}</Text>
      </View>
    </Animated.View>
  );
}

const APP_ICON = 40;

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: layout.screenPadTabs },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm },
  title: { ...type.onboarding, color: colors.forest, textAlign: 'center' },
  text: { ...type.body, color: colors.inkMuted, textAlign: 'center', maxWidth: 300 },
  actions: { gap: space.s },
  notif: {
    // 300 de contenu + padding : le prototype est en box-sizing content-box (capture 06 : 328).
    width: 300 + space.ml * 2,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: space.m,
    paddingHorizontal: space.ml,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
  },
  appIcon: {
    width: APP_ICON,
    height: APP_ICON,
    borderRadius: space.m,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifText: { flex: 1 },
  notifTitle: { ...type.buttonS, fontFamily: type.button.fontFamily, color: colors.ink },
  notifBody: { ...type.small, color: colors.inkSoft },
});
