import { Tabs } from 'expo-router/tabs';
import { StyleSheet } from 'react-native';

import { TabBar } from '@/components/TabBar';
import { colors } from '@/theme';

// Barre flottante maison (Jardin, Réglages) ; elle reste fixe, seul le contenu fait un fondu (docs/03 §2).
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, animation: 'none', sceneStyle: styles.scene }}
    >
      <Tabs.Screen name="garden" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scene: { backgroundColor: colors.bg },
});
