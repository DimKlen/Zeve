import { Tabs } from 'expo-router/tabs';

import { TabBar } from '@/components/TabBar';
import { makeStyles } from '@/theme';

// Barre flottante maison (Jardin, Réglages) ; elle reste fixe, seul le contenu fait un fondu (docs/03 §2).
export default function TabsLayout() {
  const styles = useStyles();
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

const useStyles = makeStyles((colors) => ({
  scene: { backgroundColor: colors.bg },
}));
