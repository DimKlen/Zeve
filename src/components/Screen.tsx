import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme';

type Props = {
  children?: ReactNode;
  /** Fond de l'écran : crème par défaut, forêt pour Lancement / Plante ajoutée. */
  tone?: 'light' | 'dark';
  style?: ViewStyle;
};

// Conteneur racine de chaque écran : fond et zones sûres.
// Les 5 animations d'entrée (fwd/back/up/fade/zoom) arrivent en Phase 1 (docs/03).
export function Screen({ children, tone = 'light', style }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.root,
        tone === 'dark' && styles.dark,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  dark: { backgroundColor: colors.forest },
});
