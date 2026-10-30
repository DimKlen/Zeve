import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { TextButton } from '@/components/TextButton';
import { signOut } from '@/features/auth/auth';
import { t } from '@/i18n';
import { go } from '@/motion/transitions';
import { colors, layout, space, type } from '@/theme';

// Réglages complets en Phase 6 (docs/04 §10). En attendant : déconnexion et pages de dev.
export default function SettingsScreen() {
  return (
    <Screen name="settings" refocusEnter="fade">
      <View style={styles.root}>
        <Text style={styles.title} accessibilityRole="header">
          {t('settings.title')}
        </Text>
        {__DEV__ && (
          <>
            <TextButton label={t('dev.plantsLink')} onPress={() => go('devPlants')} />
            <TextButton label={t('dev.kitchenLink')} onPress={() => go('devKitchen')} />
          </>
        )}
        <TextButton
          label={t('settings.logout')}
          color={colors.danger}
          onPress={async () => {
            await signOut();
            go('login', { replace: true });
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: layout.screenPadTabs,
    paddingTop: space.xs,
    gap: space.m,
    alignItems: 'flex-start',
  },
  title: { ...type.title, color: colors.forest },
});
