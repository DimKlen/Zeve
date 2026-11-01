import { Text, View } from 'react-native';

import type { ScreenKey } from '@/motion/transitions';
import { makeStyles, type } from '@/theme';

import { Screen } from './Screen';

type Props = {
  name?: ScreenKey;
  /** Route expo-router de l'écran : seul repère affiché pendant le développement. */
  route: string;
  tone?: 'light' | 'dark';
};

// Écran vide de la Phase 0 : remplacé écran par écran à partir de la Phase 2.
export function Placeholder({ name, route, tone = 'light' }: Props) {
  const styles = useStyles();
  return (
    <Screen name={name} tone={tone} refocusEnter={name === 'garden' ? 'fade' : 'back'}>
      <View style={styles.center}>
        <Text style={[styles.route, tone === 'dark' && styles.routeDark]}>{route}</Text>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  route: { ...type.subTitle, color: colors.forest },
  routeDark: { color: colors.darkText },
}));
