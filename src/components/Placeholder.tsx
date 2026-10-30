import { StyleSheet, Text, View } from 'react-native';

import { colors, type } from '@/theme';

import { Screen } from './Screen';

type Props = {
  /** Route expo-router de l'écran : seul repère affiché pendant le développement. */
  route: string;
  tone?: 'light' | 'dark';
};

// Écran vide de la Phase 0 : remplacé écran par écran à partir de la Phase 2.
export function Placeholder({ route, tone = 'light' }: Props) {
  return (
    <Screen tone={tone}>
      <View style={styles.center}>
        <Text style={[styles.route, tone === 'dark' && styles.routeDark]}>{route}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  route: { ...type.subTitle, color: colors.forest },
  routeDark: { color: colors.darkText },
});
