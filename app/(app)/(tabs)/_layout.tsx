import { Tabs } from 'expo-router/tabs';
import { StyleSheet } from 'react-native';

import { t } from '@/i18n';
import { colors } from '@/theme';

// TabBar flottante personnalisée (Jardin, Réglages) : Phase 3. Barre par défaut en attendant.
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, sceneStyle: styles.scene }}>
      <Tabs.Screen name="garden" options={{ title: t('nav.garden') }} />
      <Tabs.Screen name="settings" options={{ title: t('nav.settings') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scene: { backgroundColor: colors.bg },
});
